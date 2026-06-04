import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult } from '@/types'
import { audioManager } from '@/audio/audioManager'
import { speakArabic } from '@/ai/ttsService'
import { AnswerFeedback } from './AnswerFeedback'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

const OPTION_COLORS = [
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-sky-100 border-sky-300 text-sky-900',
  'bg-violet-100 border-violet-300 text-violet-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
]

export function SentenceReadMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const sentence = exercise.sentence!
  const words = sentence.arabic.split(' ')

  const [options] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )

  const handleWordTap = (word: string) => speakArabic(word)
  const playSentence = () => speakArabic(sentence.arabic)

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
        What does this sentence mean?
      </div>

      {/* Sentence card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-600 p-6 text-center shadow-xl"
      >
        <div className="text-5xl mb-4">{sentence.emoji}</div>

        {/* Tappable word chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-4" dir="rtl">
          {words.map((word, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleWordTap(word)}
              className="bg-white/20 hover:bg-white/30 text-white font-arabic text-3xl px-3 py-2 rounded-xl border border-white/30 transition-all"
            >
              {word}
            </motion.button>
          ))}
        </div>

        <button
          onClick={playSentence}
          className="text-white/70 text-sm hover:text-white transition-colors"
        >
          🔊 Hear full sentence
        </button>

        <div className="mt-3 text-white/60 text-xs">Tap each word to hear it</div>
      </motion.div>

      {/* Meaning options */}
      <div className="text-sm font-semibold text-gray-500 -mb-2">Choose the meaning:</div>
      <div className="grid grid-cols-1 gap-3 w-full">
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
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                scale: showCorrect ? [1, 1.04, 1] : 1,
                x: showWrong ? [0, -8, 8, -4, 4, 0] : 0,
              }}
              transition={{ delay: idx * 0.07 }}
              whileHover={result === 'pending' ? { scale: 1.02 } : {}}
              whileTap={result === 'pending' ? { scale: 0.97 } : {}}
              onClick={() => handleSelect(option)}
              disabled={result !== 'pending'}
              className={`rounded-2xl px-5 py-4 text-left border-2 shadow-md font-medium text-base transition-all ${colorClass}`}
            >
              {option}
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={`${sentence.arabic} — ${sentence.meaning}`}
        onContinue={onContinue}
      />
    </div>
  )
}
