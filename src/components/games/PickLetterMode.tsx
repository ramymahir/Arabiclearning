import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult, Harakah } from '@/types'
import { getLetterById, getLettersByIds } from '@/data/letters'
import { useAudio } from '@/hooks/useAudio'
import { AnswerFeedback } from './AnswerFeedback'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

const TILE_COLORS = [
  { base: 'bg-amber-100 border-amber-300 text-amber-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-sky-100 border-sky-300 text-sky-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-violet-100 border-violet-300 text-violet-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-emerald-100 border-emerald-300 text-emerald-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
]

export function PickLetterMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const { playWord, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const word = exercise.wordExample!
  const correctLetter = getLetterById(exercise.correctAnswer)!

  const [allOptionIds] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )
  const optionLetters = getLettersByIds(allOptionIds)

  useEffect(() => {
    const t = setTimeout(() => playWord(word), 400)
    return () => clearTimeout(t)
  }, [exercise.id])

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

  // Render the blanked word: replace leading '_' with a styled placeholder
  const hint = exercise.wordHint ?? ('_' + word.arabic.slice(correctLetter.arabic.length))
  const blankAndRest = hint.startsWith('_') ? hint.slice(1) : hint

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-6">
      <div className="text-center font-bold text-gray-600 text-xl">
        Which letter completes the word?
      </div>

      {/* Word display with blank */}
      <motion.button
        initial={{ scale: 0, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => playWord(word)}
        className="w-full rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 p-6 text-center shadow-xl"
      >
        <div className="text-6xl mb-3">{word.emoji}</div>
        <div className="text-4xl font-arabic text-white leading-none mb-2 flex items-center justify-center gap-1" dir="rtl">
          {/* Highlighted blank placeholder — first in DOM = rightmost in RTL (first Arabic letter) */}
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="inline-flex w-12 h-12 rounded-xl bg-white/30 border-2 border-white/60 text-white/70 text-2xl items-center justify-center"
          >
            ?
          </motion.span>
          {/* Rest of the word */}
          <span>{blankAndRest}</span>
        </div>
        <div className="text-white/70 text-sm mt-1">🔊 Tap to hear</div>
      </motion.button>

      {/* Letter tile options */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {optionLetters.map((letter, idx) => {
          const theme = TILE_COLORS[idx % TILE_COLORS.length]
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
              className={`rounded-2xl p-5 flex flex-col items-center justify-center min-h-[90px] border-2 shadow-lg transition-all ${colorClass}`}
            >
              <span className="text-5xl font-arabic leading-none" dir="rtl">
                {letter.arabic}
              </span>
              <span className="text-xs mt-1 font-medium opacity-70">{letter.transliteration}</span>
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={`${correctLetter.arabic} — ${word.arabic} (${word.meaning})`}
        onContinue={onContinue}
      />
    </div>
  )
}
