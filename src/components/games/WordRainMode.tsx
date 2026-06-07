import { useEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion'
import type { LessonExercise, AnswerResult } from '@/types'
import { AnswerFeedback } from './AnswerFeedback'
import { useAudio } from '@/hooks/useAudio'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

const OPTION_THEMES = [
  { base: 'bg-rose-500',   active: 'bg-emerald-500' },
  { base: 'bg-amber-500',  active: 'bg-emerald-500' },
  { base: 'bg-violet-600', active: 'bg-emerald-500' },
]

const FALL_DURATION = 3.2  // seconds to fall

export function WordRainMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const { playWord, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [burst, setBurst] = useState(false)
  const cardControls = useAnimationControls()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const word = exercise.wordExample!
  const [allOptions] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 2)])
  )

  // Start the fall + auto-miss timer
  useEffect(() => {
    cardControls.start({ y: '72vh', transition: { duration: FALL_DURATION, ease: 'easeIn' } })
    playWord(word)

    timerRef.current = setTimeout(() => {
      if (result === 'pending') {
        playSFX('wrong')
        onWrong()
        setResult('wrong')
      }
    }, FALL_DURATION * 1000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [exercise.id])

  const handleSelect = (option: string) => {
    if (result !== 'pending') return
    if (timerRef.current) clearTimeout(timerRef.current)
    setSelected(option)

    if (option === exercise.correctAnswer) {
      cardControls.stop()
      cardControls.start({ scale: [1, 1.4, 0], opacity: [1, 1, 0], transition: { duration: 0.4 } })
      setBurst(true)
      setResult('correct')
      playSFX('correct')
      onCorrect()
    } else {
      setResult('wrong')
      playSFX('wrong')
      onWrong()
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col px-4 pt-4 pb-36 min-h-[560px] relative overflow-hidden">
      <p className="text-center font-bold text-gray-700 text-xl mb-3">What does it mean? ⚡</p>
      <p className="text-center text-sm text-gray-400 mb-2">Tap before it lands!</p>

      {/* Confetti burst */}
      <AnimatePresence>
        {burst && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-sm ${['bg-yellow-400','bg-rose-400','bg-sky-400','bg-emerald-400','bg-violet-400'][i % 5]}`}
                style={{ width: 10, height: 10 }}
                initial={{ top: '30%', left: `${20 + Math.random() * 60}%`, scale: 0, opacity: 1 }}
                animate={{ top: `${40 + Math.random() * 40}%`, left: `${5 + Math.random() * 90}%`, scale: [0, 1.2, 0], rotate: Math.random() * 360, opacity: [1, 1, 0] }}
                transition={{ duration: 0.8 + Math.random() * 0.4, delay: Math.random() * 0.2 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Falling word card */}
      <motion.div
        animate={cardControls}
        initial={{ y: '-10vh' }}
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{ top: 90 }}
      >
        <motion.button
          onClick={() => playWord(word)}
          className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl px-8 py-5 text-center shadow-2xl shadow-teal-500/40 min-w-[160px]"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          animate={result === 'wrong' && !selected ? { x: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="text-4xl mb-1">{word.emoji}</div>
          <div className="font-arabic text-4xl font-black text-white leading-none" dir="rtl">
            {word.arabic}
          </div>
          <div className="text-white/60 text-xs mt-1">🔊 tap to hear</div>
        </motion.button>
      </motion.div>

      {/* Options pinned at bottom */}
      <div className="absolute bottom-36 left-4 right-4 flex flex-col gap-3">
        {allOptions.map((option, idx) => {
          const theme = OPTION_THEMES[idx % OPTION_THEMES.length]
          const isSelected = selected === option
          const isCorrect = option === exercise.correctAnswer
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let bgClass = theme.base
          if (isSelected && result === 'correct') bgClass = theme.active
          if (isSelected && result === 'wrong')   bgClass = 'bg-gray-500'
          if (revealCorrect)                      bgClass = theme.active

          return (
            <motion.button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={result !== 'pending'}
              whileHover={result === 'pending' ? { scale: 1.03 } : {}}
              whileTap={result === 'pending' ? { scale: 0.97 } : {}}
              animate={{
                scale: isSelected && result === 'correct' ? [1, 1.06, 1] : 1,
                x: isSelected && result === 'wrong' ? [0, -8, 8, -5, 5, 0] : 0,
              }}
              className={`${bgClass} text-white font-black text-lg py-4 rounded-2xl shadow-lg transition-colors disabled:cursor-not-allowed`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-4">
        <AnswerFeedback result={result} correctText={`${word.arabic} = ${word.meaning}`} onContinue={onContinue} />
      </div>
    </div>
  )
}
