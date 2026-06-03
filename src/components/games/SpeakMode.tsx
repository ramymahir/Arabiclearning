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
}

export function SpeakMode({
  letter,
  harakah,
  profileId,
  sessionWrongCount,
  weakLetters,
  onContinue,
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

    // Simple heuristic: correct if transcript contains the letter character
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
    })
    setFeedback(fb)
    setPhase('feedback')
  }, [attempts, letter, profileId, transcript, weakLetters, sessionWrongCount, recordSpeakAttempt, stop])

  // Auto-evaluate when countdown hits 0 or mic stops
  useEffect(() => {
    if (phase === 'listening' && countdown === 0) handleEvaluate()
  }, [countdown, phase, handleEvaluate])

  useEffect(() => {
    if (phase === 'listening' && !listening && !evaluatedRef.current) {
      // Small delay so transcript state has time to update
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
    <div className="flex flex-col items-center px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Instructions */}
      <p className="text-gray-500 text-sm mb-1 font-semibold tracking-wide uppercase">
        Say the letter!
      </p>
      <p className="text-gray-400 text-xs mb-8" dir="rtl">
        استمع ثم انطق الحرف
      </p>

      {/* Letter card — tappable to replay */}
      <motion.button
        className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/10 to-sky-100 border-2 border-primary/30 flex flex-col items-center justify-center mb-6 shadow-lg"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={playReference}
      >
        <span className="text-8xl font-arabic leading-none">{letterWithVowel}</span>
        <span className="text-sm text-gray-500 mt-2 font-mono">{letter.transliteration}</span>
        <span className="text-xs text-primary mt-1">🔊 Tap to hear again</span>
      </motion.button>

      <p className="text-center text-gray-400 text-xs mb-8 max-w-xs">
        {letter.phonemeDescription}
      </p>

      {/* Action area */}
      <AnimatePresence mode="wait">
        {phase === 'playing_audio' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🔊</span>
            </div>
            <p className="text-blue-500 text-sm">Listen carefully…</p>
          </motion.div>
        )}

        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {!supported && (
              <p className="text-amber-600 text-xs text-center max-w-xs mb-1">
                Microphone not supported in this browser. Tap Skip to continue.
              </p>
            )}
            <motion.button
              className="w-24 h-24 rounded-full bg-primary shadow-xl flex items-center justify-center text-5xl disabled:opacity-40"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleMicPress}
              disabled={!supported}
              aria-label="Start speaking"
            >
              🎤
            </motion.button>
            <p className="text-gray-600 text-sm font-semibold">Tap to speak!</p>
            {attempts > 0 && (
              <button
                onClick={onContinue}
                className="text-gray-400 text-xs underline mt-1"
              >
                Skip
              </button>
            )}
          </motion.div>
        )}

        {phase === 'listening' && (
          <motion.div
            key="listening"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Countdown ring */}
            <div className="relative w-24 h-24">
              <svg className="absolute inset-0 -rotate-90" width="96" height="96">
                <circle cx="48" cy="48" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="#58CC02"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 * (1 - countdown / 5)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl animate-pulse">🎙️</span>
              </div>
            </div>
            <p className="text-primary font-bold text-sm">Listening… {countdown}s</p>
            <button
              onClick={() => handleEvaluate()}
              className="text-gray-400 text-xs underline"
            >
              Done
            </button>
          </motion.div>
        )}

        {phase === 'evaluating' && (
          <motion.div
            key="evaluating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-3xl animate-spin">⭐</span>
            </div>
            <p className="text-yellow-600 text-sm font-medium">Checking…</p>
          </motion.div>
        )}

        {phase === 'feedback' && feedback && (
          <motion.div
            key="feedback"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col items-center gap-4"
          >
            <span className="text-5xl">{feedback.emoji}</span>

            <p className="text-2xl font-arabic text-gray-800 text-center" dir="rtl">
              {feedback.arabicMessage}
            </p>

            <p className="text-gray-500 text-center text-sm">{feedback.englishMessage}</p>

            {feedback.hint && (
              <div className="w-full bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-blue-700 text-xs font-medium">💡 {feedback.hint}</p>
              </div>
            )}

            {transcript ? (
              <p className="text-gray-300 text-xs">I heard: "{transcript}"</p>
            ) : null}

            <div className="flex gap-3 w-full mt-1">
              {feedback.shouldRepeat && attempts < 3 && (
                <button
                  onClick={handleTryAgain}
                  className="flex-1 py-3 rounded-2xl border-2 border-primary text-primary font-bold text-sm"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={onContinue}
                className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
