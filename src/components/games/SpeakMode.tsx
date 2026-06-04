import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ArabicLetter, Harakah } from '@/types'
import { applyHarakah } from '@/utils/arabic'
import { speakArabic } from '@/ai/ttsService'
import { getTeacherFeedback, type TeacherFeedback } from '@/ai/teacherAgent'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useAdaptiveStore } from '@/store/adaptiveStore'

type Phase = 'playing_audio' | 'ready' | 'listening' | 'evaluating' | 'feedback'

interface Props {
  letter: ArabicLetter
  harakah: Harakah
  profileId: string
  sessionWrongCount: number
  weakLetters: string[]
  onContinue: () => void
  letterAccuracy?: number
  studentLevel?: 'beginner' | 'explorer' | 'star'
  totalLessonsCompleted?: number
}

const BAR_HEIGHTS = [40, 65, 90, 65, 40]

export function SpeakMode({
  letter,
  harakah,
  profileId,
  sessionWrongCount,
  weakLetters,
  onContinue,
  letterAccuracy,
  studentLevel,
  totalLessonsCompleted,
}: Props) {
  const [phase, setPhase] = useState<Phase>('playing_audio')
  const [attempts, setAttempts] = useState(0)
  const [countdown, setCountdown] = useState(5)
  const [feedback, setFeedback] = useState<TeacherFeedback | null>(null)
  const evaluatedRef = useRef(false)

  const { supported, listening, transcript, start, stop, reset } = useSpeechRecognition('ar-SA', 5000)
  const recordSpeakAttempt = useAdaptiveStore((s) => s.recordSpeakAttempt)

  const letterWithVowel = applyHarakah(letter.arabic, harakah)
  const speakText = letterWithVowel || letter.ttsFallback

  const playReference = useCallback(() => {
    speakArabic(speakText)
  }, [speakText])

  // Auto-play reference on mount
  useEffect(() => {
    playReference()
    const timer = setTimeout(() => setPhase('ready'), 2200)
    return () => clearTimeout(timer)
  }, [playReference])

  // Countdown timer while listening
  useEffect(() => {
    if (phase !== 'listening') return
    setCountdown(5)
    evaluatedRef.current = false
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  const handleEvaluate = useCallback(async () => {
    if (evaluatedRef.current) return
    evaluatedRef.current = true
    stop()
    setPhase('evaluating')

    const currentAttempts = attempts + 1
    setAttempts(currentAttempts)

    const isCorrect =
      transcript.includes(letter.arabic) ||
      transcript.toLowerCase().includes(letter.transliteration.toLowerCase().replace('-', ''))
    recordSpeakAttempt(profileId, letter.id, isCorrect)

    const fb = await getTeacherFeedback({
      letterId: letter.id,
      letterArabic: letter.arabic,
      transliteration: letter.transliteration,
      phonemeDescription: letter.phonemeDescription,
      childAttempt: transcript,
      exerciseType: 'speak',
      previousAttempts: currentAttempts - 1,
      weakLetters,
      sessionWrongCount,
      letterAccuracy,
      studentLevel,
      totalLessonsCompleted,
    })
    setFeedback(fb)
    setPhase('feedback')
  }, [attempts, letter, profileId, transcript, weakLetters, sessionWrongCount, recordSpeakAttempt, stop])

  useEffect(() => {
    if (phase === 'listening' && countdown === 0) handleEvaluate()
  }, [countdown, phase, handleEvaluate])

  useEffect(() => {
    if (phase === 'listening' && !listening && !evaluatedRef.current) {
      const t = setTimeout(() => handleEvaluate(), 200)
      return () => clearTimeout(t)
    }
  }, [listening, phase, handleEvaluate])

  const handleMicPress = () => {
    reset()
    evaluatedRef.current = false
    setPhase('listening')
    start()
  }

  const handleTryAgain = () => {
    reset()
    setFeedback(null)
    playReference()
    setTimeout(() => setPhase('ready'), 1800)
    setPhase('playing_audio')
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 py-6 gap-6">

      {/* ── Letter Display Card ── */}
      <motion.button
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={playReference}
        className="w-full rounded-3xl bg-gradient-to-br from-violet-400 to-purple-600 p-8 text-center shadow-xl"
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-8xl font-arabic text-white leading-none mb-3"
          dir="rtl"
        >
          {letterWithVowel}
        </motion.div>
        <div className="text-xl text-white/80 font-semibold">Say this letter!</div>
        <div className="text-sm text-white/60 mt-1 italic">{letter.phonemeDescription}</div>
        <div className="mt-3 text-white/70 text-sm">🔊 Tap to hear again</div>
      </motion.button>

      {/* ── Microphone / Feedback Area ── */}
      <AnimatePresence mode="wait">

        {/* Playing audio phase */}
        {phase === 'playing_audio' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xl"
            >
              <span className="text-5xl">🔊</span>
            </motion.div>
            <p className="text-blue-500 text-lg font-semibold">Listen carefully…</p>
          </motion.div>
        )}

        {/* Ready to speak */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {!supported && (
              <p className="text-amber-600 text-sm text-center max-w-xs">
                Microphone not supported in this browser. Tap Skip to continue.
              </p>
            )}
            <motion.button
              className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl flex items-center justify-center text-5xl disabled:opacity-40"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMicPress}
              disabled={!supported}
              aria-label="Start speaking"
            >
              🎤
            </motion.button>
            <p className="text-gray-600 text-lg font-semibold">Tap to speak</p>
            {attempts > 0 && (
              <button onClick={onContinue} className="text-gray-400 text-sm underline mt-1">
                Skip
              </button>
            )}
          </motion.div>
        )}

        {/* Listening */}
        {phase === 'listening' && (
          <motion.div
            key="listening"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Pulsing rose circle */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-xl"
            >
              <span className="text-5xl">🔴</span>
            </motion.div>

            {/* Sound wave bars */}
            <div className="flex items-end gap-1 h-16">
              {BAR_HEIGHTS.map((h, i) => (
                <motion.div
                  key={i}
                  className="w-3 rounded-full bg-rose-400"
                  animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.4}%`] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                  style={{ height: `${h * 0.4}%` }}
                />
              ))}
            </div>

            <p className="text-rose-500 text-lg font-semibold">Listening… {countdown}s</p>
            <button onClick={() => handleEvaluate()} className="text-gray-400 text-sm underline">
              Done
            </button>
          </motion.div>
        )}

        {/* Evaluating */}
        {phase === 'evaluating' && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="text-5xl"
            >
              ⏳
            </motion.div>
            <p className="text-gray-500 text-lg font-medium">Checking…</p>
          </motion.div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && feedback && (
          <motion.div
            key="feedback"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col items-center gap-4"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="text-6xl"
            >
              {feedback.emoji}
            </motion.span>

            <p className="text-2xl font-arabic text-gray-800 text-center" dir="rtl">
              {feedback.arabicMessage}
            </p>

            <p className="text-gray-500 text-center text-base">{feedback.englishMessage}</p>

            {feedback.hint && (
              <div className="w-full bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-blue-700 text-sm font-medium">💡 {feedback.hint}</p>
              </div>
            )}

            {transcript ? (
              <div className="w-full bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-gray-500 text-sm">You said:</p>
                <p className="text-gray-700 font-arabic text-lg" dir="rtl">{transcript}</p>
              </div>
            ) : null}

            <div className="flex gap-3 w-full mt-1">
              {feedback.shouldRepeat && attempts < 3 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleTryAgain}
                  className="flex-1 py-4 rounded-2xl border-2 border-violet-400 text-violet-600 font-bold text-lg"
                >
                  Try Again
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={onContinue}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-lg shadow-lg"
              >
                Continue →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
