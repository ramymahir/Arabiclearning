import { useEffect, useState } from 'react'
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
  { base: 'bg-amber-100 border-amber-300 text-amber-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-sky-100 border-sky-300 text-sky-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-violet-100 border-violet-300 text-violet-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-emerald-100 border-emerald-300 text-emerald-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
]

export function WordListenMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [played, setPlayed] = useState(false)

  const word = exercise.wordExample!
  const [options] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )

  const playWord = () => {
    audioManager.playWord(word.audioFile, word.arabic)
    setPlayed(true)
  }

  useEffect(() => {
    const t = setTimeout(playWord, 400)
    return () => clearTimeout(t)
  }, [exercise.id])

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
        Which word did you hear?
      </div>

      {/* Speaker button */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={playWord}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-300/40"
        >
          <motion.span
            className="text-5xl"
            animate={!played ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🔊
          </motion.span>
        </motion.button>
        <div className="text-4xl">{word.emoji}</div>
        {played && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 font-medium"
          >
            Tap to hear again
          </motion.p>
        )}
      </div>

      {/* 2×2 Arabic word options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((option, idx) => {
          const theme = OPTION_COLORS[idx % OPTION_COLORS.length]
          const isSelected = selected === option
          const isCorrect = option === exercise.correctAnswer
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let colorClass = theme.base
          if (showCorrect || revealCorrect) colorClass = theme.correct
          if (showWrong) colorClass = theme.wrong
          if (!isSelected && result !== 'pending' && !revealCorrect) colorClass = `${theme.base} opacity-50`

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
              className={`rounded-2xl p-5 flex items-center justify-center min-h-[80px] border-2 shadow-lg transition-all font-arabic text-3xl ${colorClass}`}
              dir="rtl"
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={`${word.arabic} — ${word.meaning}`}
        onContinue={onContinue}
      />
    </div>
  )
}
