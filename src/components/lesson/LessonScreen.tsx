import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson, LessonExercise } from '@/types'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useGameStore } from '@/store/gameStore'
import { useAdaptiveStore } from '@/store/adaptiveStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { getLetterById } from '@/data/letters'
import { adaptExercises, type LetterMastery } from '@/data/exercises'
import { pushToCloud } from '@/lib/syncManager'
import { applyHarakah } from '@/utils/arabic'
import { audioManager } from '@/audio/audioManager'
import { getTeacherFeedback, type TeacherFeedback } from '@/ai/teacherAgent'
import { ExerciseProgress } from './ExerciseProgress'
import { LessonIntro } from './LessonIntro'
import { LessonResult } from './LessonResult'
import { TeacherFeedbackOverlay } from './TeacherFeedbackOverlay'
import { TeachMode } from '@/components/games/TeachMode'
import { ListenPickMode } from '@/components/games/ListenPickMode'
import { MatchMode } from '@/components/games/MatchMode'
import { DragDropMode } from '@/components/games/DragDropMode'
import { SpeakMode } from '@/components/games/SpeakMode'
import { WordListenMode } from '@/components/games/WordListenMode'
import { WordMatchMode } from '@/components/games/WordMatchMode'
import { SentenceReadMode } from '@/components/games/SentenceReadMode'
import { HarakahPickMode } from '@/components/games/HarakahPickMode'
import { PickLetterMode } from '@/components/games/PickLetterMode'
import { WordBuildMode } from '@/components/games/WordBuildMode'
import { BalloonPopMode } from '@/components/games/BalloonPopMode'
import { MemoryFlipMode } from '@/components/games/MemoryFlipMode'
import { WordRainMode } from '@/components/games/WordRainMode'
import { HeartBar } from '@/components/ui/HeartBar'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

type Phase = 'intro' | 'playing' | 'result'

interface Props {
  lesson: Lesson
}

export function LessonScreen({ lesson }: Props) {
  const navigate = useNavigate()
  const activeId = useProfileStore((s) => s.activeProfileId)!
  const getProgress = useProgressStore((s) => s.getProgress)
  const completeLesson = useProgressStore((s) => s.completeLesson)
  const deductHeart = useProgressStore((s) => s.deductHeart)
  const getWeakLetters = useAdaptiveStore((s) => s.getWeakLetters)
  const recordAttempt = useAdaptiveStore((s) => s.recordAttempt)

  const getStats = useAdaptiveStore((s) => s.getStats)
  const getLevel = useOnboardingStore((s) => s.getLevel)

  const { startSession, submitAnswer, nextExercise, endSession } = useGameStore()

  const [phase, setPhase] = useState<Phase>('intro')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [exercises, setExercises] = useState<LessonExercise[]>(lesson.exercises)
  const [wrongCount, setWrongCount] = useState(0)
  const [showHeartOut, setShowHeartOut] = useState(false)
  const [result, setResult] = useState<{ stars: number; xpEarned: number; leveledUp: boolean } | null>(null)
  const [teacherFeedback, setTeacherFeedback] = useState<TeacherFeedback | null>(null)

  // Holds resolved teacher feedback waiting to be shown after "Continue"
  const pendingFeedbackRef = useRef<TeacherFeedback | null>(null)
  // Mastery snapshot taken at lesson start — prevents mid-lesson re-adaptation
  const masteryMapRef = useRef<Record<string, LetterMastery>>({})
  // Per-letter wrong counts this session (for LessonResult tip card)
  const sessionLetterWrongsRef = useRef<Record<string, number>>({})

  const progress = getProgress(activeId)
  const hearts = progress.hearts
  const currentExercise = exercises[exerciseIndex]
  const currentLetter = currentExercise ? getLetterById(currentExercise.letterId) : null
  const weakLetterIds = getWeakLetters(activeId)

  const rawLevel = getLevel(activeId)
  const studentLevel = (['beginner', 'explorer', 'star'] as const)[rawLevel ?? 0] ?? 'beginner'
  const totalLessonsCompleted = Object.values(getProgress(activeId).lessons).filter((l) => l.stars > 0).length

  const handleStart = () => {
    // Snapshot mastery data once so adaptation doesn't shift mid-lesson
    const stats = getStats(activeId)
    masteryMapRef.current = Object.fromEntries(
      stats.map((s) => [
        s.letterId,
        { accuracy: s.attempts > 0 ? s.correct / s.attempts : 1.0, attempts: s.attempts },
      ])
    )
    const adapted = adaptExercises(lesson.exercises, masteryMapRef.current, lesson.letterIds)
    setExercises(adapted)
    sessionLetterWrongsRef.current = {}
    startSession(lesson.id, activeId, adapted.length, hearts)
    setPhase('playing')
    setExerciseIndex(0)
    setWrongCount(0)
  }

  const handleCorrect = () => {
    submitAnswer(true)
    if (currentExercise) recordAttempt(activeId, currentExercise.letterId, true)
  }

  const handleWrong = () => {
    submitAnswer(false)
    deductHeart(activeId)
    const newWrong = wrongCount + 1
    setWrongCount(newWrong)
    if (currentExercise) {
      recordAttempt(activeId, currentExercise.letterId, false)
      const lid = currentExercise.letterId
      sessionLetterWrongsRef.current[lid] = (sessionLetterWrongsRef.current[lid] ?? 0) + 1
    }

    if (hearts - newWrong <= 0) {
      setShowHeartOut(true)
      return
    }

    // Fire teacher feedback fetch in the background
    if (currentLetter) {
      const lid = currentExercise!.letterId
      const stat = useAdaptiveStore.getState().data[activeId]?.[lid]
      const letterAccuracy = stat && stat.attempts > 0 ? stat.correct / stat.attempts : 1.0
      pendingFeedbackRef.current = null
      getTeacherFeedback({
        letterId: lid,
        letterArabic: currentLetter.arabic,
        transliteration: currentLetter.transliteration,
        phonemeDescription: currentLetter.phonemeDescription,
        childAttempt: '',
        exerciseType: currentExercise!.type,
        previousAttempts: 0,
        weakLetters: weakLetterIds,
        sessionWrongCount: newWrong,
        letterAccuracy,
        studentLevel,
        totalLessonsCompleted,
      }).then((fb) => {
        pendingFeedbackRef.current = fb
      }).catch(() => {})
    }
  }

  const advanceExercise = () => {
    const nextIndex = exerciseIndex + 1
    if (nextIndex >= exercises.length || hearts - wrongCount <= 0) {
      const completed = completeLesson(activeId, lesson.id, wrongCount)
      setResult(completed)
      setPhase('result')
      endSession()
      pushToCloud()
    } else {
      nextExercise()
      setExerciseIndex(nextIndex)
    }
  }

  const handleContinue = () => {
    const fb = pendingFeedbackRef.current
    pendingFeedbackRef.current = null
    if (fb) {
      setTeacherFeedback(fb)
      return // overlay will call advanceExercise via handleDismissTeacher
    }
    advanceExercise()
  }

  const handleDismissTeacher = () => {
    setTeacherFeedback(null)
    advanceExercise()
  }

  const handleRetry = () => {
    setPhase('intro')
    setExerciseIndex(0)
    setExercises(lesson.exercises)
    setWrongCount(0)
    setResult(null)
    pendingFeedbackRef.current = null
    sessionLetterWrongsRef.current = {}
    setTeacherFeedback(null)
    endSession()
  }

  // Warm TTS cache while child reads the intro card
  useEffect(() => {
    const texts = lesson.letterIds
      .map((id) => {
        const l = getLetterById(id)
        return l ? applyHarakah(l.arabic, lesson.harakah) : null
      })
      .filter(Boolean) as string[]
    audioManager.preloadLetters(texts)
  }, [lesson.id])

  if (phase === 'intro') {
    return <LessonIntro lesson={lesson} onStart={handleStart} />
  }

  if (phase === 'result' && result) {
    return (
      <LessonResult
        stars={result.stars}
        xpEarned={result.xpEarned}
        lessonId={lesson.id}
        leveledUp={result.leveledUp}
        onRetry={handleRetry}
        sessionLetterWrongs={sessionLetterWrongsRef.current}
        lessonLetterIds={lesson.letterIds}
      />
    )
  }

  if (!currentExercise) return null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-border px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-gray-600 text-2xl">
            ✕
          </button>
          <div className="flex-1">
            <ExerciseProgress total={exercises.length} current={exerciseIndex} />
          </div>
          <HeartBar hearts={Math.max(0, hearts - wrongCount)} size="sm" />
        </div>
      </div>

      {/* Exercise area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${lesson.id}-${exerciseIndex}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {currentExercise.type === 'teach' && currentLetter && (
              <TeachMode
                letter={currentLetter}
                harakah={lesson.harakah}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'speak' && currentLetter && (
              <SpeakMode
                letter={currentLetter}
                harakah={lesson.harakah}
                profileId={activeId}
                sessionWrongCount={wrongCount}
                weakLetters={weakLetterIds}
                onContinue={handleContinue}
                letterAccuracy={masteryMapRef.current[currentLetter.id]?.accuracy}
                studentLevel={studentLevel}
                totalLessonsCompleted={totalLessonsCompleted}
              />
            )}
            {currentExercise.type === 'listen_pick' && (
              <ListenPickMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'match' && (
              <MatchMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'dragdrop' && (
              <DragDropMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'word_listen' && (
              <WordListenMode
                exercise={currentExercise}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'word_match' && (
              <WordMatchMode
                exercise={currentExercise}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'sentence_read' && currentExercise.sentence && (
              <SentenceReadMode
                exercise={currentExercise}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'harakah_pick' && (
              <HarakahPickMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'pick_letter' && (
              <PickLetterMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'word_build' && (
              <WordBuildMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'balloon_pop' && (
              <BalloonPopMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'memory_flip' && (
              <MemoryFlipMode
                exercise={currentExercise}
                harakah={lesson.harakah}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
            {currentExercise.type === 'word_rain' && (
              <WordRainMode
                exercise={currentExercise}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onContinue={handleContinue}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Teacher feedback overlay — slides up after wrong answers */}
      <TeacherFeedbackOverlay feedback={teacherFeedback} onDismiss={handleDismissTeacher} />

      {/* No hearts modal */}
      <Modal open={showHeartOut} onClose={() => {}}>
        <div className="bg-white rounded-3xl p-6 mx-4 text-center shadow-2xl">
          <div className="text-6xl mb-3">💔</div>
          <h2 className="text-2xl font-bold mb-2">No more hearts!</h2>
          <p className="text-gray-500 mb-6">
            Hearts refill over time, or finish this lesson and try again!
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/home')} className="flex-1">
              Go Home
            </Button>
            <Button
              onClick={() => {
                setShowHeartOut(false)
                handleRetry()
              }}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
