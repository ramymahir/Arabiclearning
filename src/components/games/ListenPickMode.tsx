import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult } from '@/types'
import { getLetterById, getLettersByIds } from '@/data/letters'
import { AnswerFeedback } from './AnswerFeedback'
import { useAudio } from '@/hooks/useAudio'
import { shuffle } from '@/utils/shuffle'
import { applyHarakah } from '@/utils/arabic'
import type { Harakah } from '@/types'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

// Per-option color themes (unselected, correct, wrong)
const OPTION_COLORS = [
  { base: 'bg-amber-100 border-amber-300 text-amber-800', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-sky-100 border-sky-300 text-sky-800', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-violet-100 border-violet-300 text-violet-800', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-emerald-100 border-emerald-300 text-emerald-800', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
]

export function ListenPickMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [played, setPlayed] = useState(false)

  const correctLetter = getLetterById(exercise.correctAnswer)!
  const [allOptions] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )
  const optionLetters = getLettersByIds(allOptions)

  const letterSound = applyHarakah(correctLetter.arabic, harakah)

  useEffect(() => {
    if (correctLetter) {
      const t = setTimeout(() => {
        playLetter(correctLetter, letterSound)
        setPlayed(true)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [exercise.id])

  const handlePlay = () => {
    playLetter(correctLetter, letterSound)
    setPlayed(true)
  }

  const handleSelect = (letterId: string) => {
    if (result !== 'pending') return
    setSelected(letterId)
    if (letterId === exercise.correctAnswer) {
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
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-6">
      <div className="text-center font-bold text-gray-600 text-xl">
        What letter makes this sound?
      </div>

      {/* Speaker button */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={handlePlay}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-xl shadow-sky-300/40"
        >
          <motion.span
            className="text-5xl"
            animate={!played ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🔊
          </motion.span>
        </motion.button>
        {played && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 font-medium"
          >
            Tap to hear again 🔊
          </motion.p>
        )}
      </div>

      {/* 2×2 option grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {optionLetters.map((letter, idx) => {
          const theme = OPTION_COLORS[idx % OPTION_COLORS.length]
          const isSelected = selected === letter.id
          const isCorrect = letter.id === exercise.correctAnswer
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let colorClass = theme.base
          if (showCorrect || revealCorrect) colorClass = theme.correct
          if (showWrong) colorClass = theme.wrong
          if (!isSelected && result !== 'pending' && !revealCorrect) colorClass = `${theme.base} opacity-60`

          return (
            <motion.button
              key={letter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: showCorrect ? [1, 1.12, 1] : 1,
                x: showWrong ? [0, -8, 8, -6, 6, 0] : 0,
              }}
              transition={{ delay: idx * 0.08 }}
              whileHover={result === 'pending' ? { scale: 1.05 } : {}}
              whileTap={result === 'pending' ? { scale: 0.95 } : {}}
              onClick={() => handleSelect(letter.id)}
              disabled={result !== 'pending'}
              className={`
                rounded-2xl p-6 flex flex-col items-center justify-center min-h-[100px]
                border-2 shadow-lg transition-all font-bold
                ${colorClass}
              `}
            >
              <span className="text-5xl font-arabic" dir="rtl">
                {applyHarakah(letter.arabic, harakah)}
              </span>
            </motion.button>
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
