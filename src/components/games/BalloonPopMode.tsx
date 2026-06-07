import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LessonExercise, AnswerResult, Harakah } from '@/types'
import { getLetterById, getLettersByIds } from '@/data/letters'
import { AnswerFeedback } from './AnswerFeedback'
import { useAudio } from '@/hooks/useAudio'
import { shuffle } from '@/utils/shuffle'
import { applyHarakah } from '@/utils/arabic'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

const BALLOON_THEMES = [
  { bg: 'bg-rose-500',   shadow: 'shadow-rose-400/50'   },
  { bg: 'bg-amber-500',  shadow: 'shadow-amber-400/50'  },
  { bg: 'bg-violet-600', shadow: 'shadow-violet-400/50' },
  { bg: 'bg-sky-500',    shadow: 'shadow-sky-400/50'    },
]

const CONFETTI_COLORS = ['bg-yellow-400', 'bg-rose-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400', 'bg-orange-400']
const BOB_DELAYS   = [0, 0.55, 0.25, 0.75]
const BOB_DURATION = [2.2, 2.6, 2.0, 2.9]

export function BalloonPopMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [burst, setBurst] = useState(false)

  const correctLetter = getLetterById(exercise.correctAnswer)!
  const [allOptions] = useState(() => shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)]))
  const optionLetters = getLettersByIds(allOptions)
  const letterSound = applyHarakah(correctLetter.arabic, harakah)

  useEffect(() => {
    const t = setTimeout(() => playLetter(correctLetter, letterSound), 400)
    return () => clearTimeout(t)
  }, [exercise.id])

  const handleTap = (letterId: string) => {
    if (result !== 'pending') return
    setSelected(letterId)
    if (letterId === exercise.correctAnswer) {
      setResult('correct')
      playSFX('correct')
      setBurst(true)
      onCorrect()
    } else {
      setResult('wrong')
      playSFX('wrong')
      onWrong()
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-5">
      <p className="text-center font-bold text-gray-700 text-xl">Pop the right balloon! 🎈</p>

      {/* Replay */}
      <motion.button
        onClick={() => playLetter(correctLetter, letterSound)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xl shadow-sky-300/40"
      >
        <span className="text-4xl">🔊</span>
      </motion.button>

      {/* Confetti burst */}
      <AnimatePresence>
        {burst && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-sm ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`}
                style={{ width: 10, height: 10 }}
                initial={{ top: '42%', left: `${25 + Math.random() * 50}%`, scale: 0, rotate: 0, opacity: 1 }}
                animate={{
                  top: `${50 + Math.random() * 35}%`,
                  left: `${5 + Math.random() * 90}%`,
                  scale: [0, 1.4, 0.8],
                  rotate: Math.random() * 540,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 0.7 + Math.random() * 0.5, delay: Math.random() * 0.2 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 2×2 balloon grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {optionLetters.map((letter, idx) => {
          const theme = BALLOON_THEMES[idx % BALLOON_THEMES.length]
          const isSelected = selected === letter.id
          const isCorrect = letter.id === exercise.correctAnswer
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let bgClass = theme.bg
          if (isSelected && result === 'correct') bgClass = 'bg-emerald-500'
          if (isSelected && result === 'wrong')   bgClass = 'bg-gray-500'
          if (revealCorrect)                      bgClass = 'bg-emerald-500'
          const dimmed = result !== 'pending' && !isSelected && !revealCorrect

          return (
            <motion.div
              key={letter.id}
              className="flex flex-col items-center"
              animate={
                isSelected
                  ? result === 'correct'
                    ? { scale: [1, 1.35, 0], opacity: [1, 1, 0] }
                    : { scale: [1, 0.65, 0], opacity: [1, 0.6, 0] }
                  : { y: [0, -13, 0] }
              }
              transition={
                isSelected
                  ? { duration: 0.35, times: [0, 0.4, 1] }
                  : { repeat: Infinity, duration: BOB_DURATION[idx], delay: BOB_DELAYS[idx], ease: 'easeInOut' }
              }
            >
              {/* Balloon body */}
              <motion.button
                onClick={() => handleTap(letter.id)}
                disabled={result !== 'pending'}
                whileHover={result === 'pending' ? { scale: 1.07 } : {}}
                whileTap={result === 'pending' ? { scale: 0.93 } : {}}
                className={`
                  w-28 h-32 rounded-full flex items-center justify-center shadow-xl
                  ${bgClass} ${theme.shadow} transition-colors duration-200
                  ${dimmed ? 'opacity-40' : ''}
                  ${revealCorrect ? 'ring-4 ring-white ring-offset-2' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                <span className="font-arabic text-5xl font-black text-white select-none" dir="rtl">
                  {applyHarakah(letter.arabic, harakah)}
                </span>
              </motion.button>
              {/* Knot */}
              {!isSelected && (
                <div className={`w-3 h-3 rounded-full ${bgClass} -mt-1`} />
              )}
              {/* String */}
              {!isSelected && (
                <div className="w-px h-14 bg-gray-400 opacity-50" />
              )}
            </motion.div>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={applyHarakah(correctLetter.arabic, harakah)}
        onContinue={onContinue}
      />
    </div>
  )
}
