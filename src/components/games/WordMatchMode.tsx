import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult } from '@/types'
import { audioManager } from '@/audio/audioManager'
import { AnswerFeedback } from './AnswerFeedback'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

const OPTION_COLORS = [
  'bg-amber-100 border-amber-300 text-amber-900 hover:border-amber-500',
  'bg-sky-100 border-sky-300 text-sky-900 hover:border-sky-500',
  'bg-violet-100 border-violet-300 text-violet-900 hover:border-violet-500',
  'bg-emerald-100 border-emerald-300 text-emerald-900 hover:border-emerald-500',
]

export function WordMatchMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const word = exercise.wordExample!
  const [options] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )

  const playWord = () => audioManager.playWord(word.audioFile, word.arabic)

  const handleSelect = (option: string) => {
    if (result !== 'pending') return
    setSelected(option)
    if (option === exercise.correctAnswer) {
      setResult('correct')
      audioManager.playSFX('correct')
      onCorrect()
    } else {
      setResult('wrong')
      audioManager.playSFX('wrong')
      onWrong()
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-6">
      <div className="text-center font-bold text-gray-600 text-xl">
        What does this word mean?
      </div>

      {/* Word display card */}
      <motion.button
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        onClick={playWord}
        className="w-full rounded-3xl bg-gradient-to-br from-teal-400 to-emerald-600 p-8 text-center shadow-xl"
      >
        <div className="text-7xl mb-3">{word.emoji}</div>
        <div className="text-4xl font-arabic text-white leading-none mb-2" dir="rtl">
          {word.arabic}
        </div>
        <div className="text-white/70 text-sm mt-2">🔊 Tap to hear</div>
      </motion.button>

      {/* English meaning options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((option, idx) => {
          const isSelected = selected === option
          const isCorrect = option === exercise.correctAnswer
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let colorClass = OPTION_COLORS[idx % OPTION_COLORS.length]
          if (showCorrect || revealCorrect) colorClass = 'bg-emerald-400 border-emerald-500 text-white'
          if (showWrong) colorClass = 'bg-rose-400 border-rose-500 text-white'
          if (!isSelected && result !== 'pending' && !revealCorrect) colorClass = `${OPTION_COLORS[idx % OPTION_COLORS.length]} opacity-60`

          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: showCorrect ? [1, 1.12, 1] : 1,
                x: showWrong ? [0, -8, 8, -6, 6, 0] : 0,
              }}
              transition={{ delay: idx * 0.08 }}
              whileHover={result === 'pending' ? { scale: 1.04 } : {}}
              whileTap={result === 'pending' ? { scale: 0.95 } : {}}
              onClick={() => handleSelect(option)}
              disabled={result !== 'pending'}
              className={`rounded-2xl p-4 min-h-[72px] flex items-center justify-center text-center border-2 shadow-md font-semibold text-base transition-all ${colorClass}`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={`${word.arabic} = ${word.meaning}`}
        onContinue={onContinue}
      />
    </div>
  )
}
