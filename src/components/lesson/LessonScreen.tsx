import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lesson } from '@/types'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useGameStore } from '@/store/gameStore'
import { getLetterById } from '@/data/letters'
import { ExerciseProgress } from './ExerciseProgress'
import { LessonIntro } from './LessonIntro'
import { LessonResult } from './LessonResult'
import { TeachMode } from '@/components/games/TeachMode'
import { ListenPickMode } from '@/components/games/ListenPickMode'
import { MatchMode } from '@/components/games/MatchMode'
import { DragDropMode } from '@/components/games/DragDropMode'
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

  const { startSession, submitAnswer, nextExercise, session, endSession } = useGameStore()

  const [phase, setPhase] = useState<Phase>('intro')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [showHeartOut, setShowHeartOut] = useState(false)
  const [result, setResult] = useState<{ stars: number; xpEarned: number; leveledUp: boolean } | null>(null)

  const progress = getProgress(activeId)
  const hearts = progress.hearts
  const exercises = lesson.exercises
  const currentExercise = exercises[exerciseIndex]

  const handleStart = () => {
    startSession(lesson.id, activeId, exercises.length, hearts)
    setPhase('playing')
    setExerciseIndex(0)
    setWrongCount(0)
  }

  const handleCorrect = () => {
    submitAnswer(true)
  }

  const handleWrong = () => {
    submitAnswer(false)
    deductHeart(activeId)
    setWrongCount((w) => w + 1)
    const newHearts = hearts - 1
    if (newHearts <= 0) {
      setShowHeartOut(true)
    }
  }

  const handleContinue = () => {
    const nextIndex = exerciseIndex + 1
    if (nextIndex >= exercises.length || hearts - wrongCount <= 0) {
      const completed = completeLesson(activeId, lesson.id, wrongCount)
      setResult(completed)
      setPhase('result')
      endSession()
    } else {
      nextExercise()
      setExerciseIndex(nextIndex)
    }
  }

  const handleRetry = () => {
    setPhase('intro')
    setExerciseIndex(0)
    setWrongCount(0)
    setResult(null)
    endSession()
  }

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
      />
    )
  }

  if (!currentExercise) {
    return null
  }

  const currentLetter = getLetterById(currentExercise.letterId)

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
          </motion.div>
        </AnimatePresence>
      </div>

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
