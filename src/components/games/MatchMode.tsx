import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

const WORD_CARD_COLORS = [
  'bg-amber-50 border-amber-200 hover:border-amber-400',
  'bg-sky-50 border-sky-200 hover:border-sky-400',
  'bg-violet-50 border-violet-200 hover:border-violet-400',
  'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
]

export function MatchMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playWord, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const correctLetter = getLetterById(exercise.correctAnswer)!
  const [allOptionIds] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  )
  const optionLetters = getLettersByIds(allOptionIds)

  const [wordOptions] = useState(() =>
    shuffle(
      optionLetters.map((l) => ({
        letterId: l.id,
        word: l.examples[0],
      }))
    )
  )

  const letterSound = applyHarakah(correctLetter.arabic, harakah)

  useEffect(() => {
    const t = setTimeout(() => playLetter(correctLetter, letterSound), 200)
    return () => clearTimeout(t)
  }, [exercise.id])

  const handleSelect = (letterId: string) => {
    if (result !== 'pending') return
    setSelected(letterId)
    if (letterId === exercise.correctAnswer) {
      setResult('correct')
      playSFX('correct')
      if (exercise.wordExample) playWord(exercise.wordExample)
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
        Match the letter to its word!
      </div>

      {/* Letter prompt card — violet gradient */}
      <motion.button
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => playLetter(correctLetter, letterSound)}
        className="w-44 h-44 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 shadow-xl flex flex-col items-center justify-center"
      >
        <span className="text-6xl font-arabic text-white leading-none" dir="rtl">
          {applyHarakah(correctLetter.arabic, harakah)}
        </span>
        <span className="text-white/80 text-lg mt-2">🔊 Tap to hear</span>
      </motion.button>

      {/* Word option cards */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {wordOptions.map(({ letterId, word }, i) => {
          const isCorrect = letterId === exercise.correctAnswer
          const isSelected = selected === letterId
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let cardClass = WORD_CARD_COLORS[i % WORD_CARD_COLORS.length]
          if (showCorrect || revealCorrect) cardClass = 'bg-emerald-400 border-emerald-500'
          if (showWrong) cardClass = 'bg-rose-400 border-rose-500'
          if (!isSelected && result !== 'pending' && !revealCorrect) cardClass = `${WORD_CARD_COLORS[i % WORD_CARD_COLORS.length]} opacity-60`

          return (
            <motion.button
              key={letterId}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: showCorrect ? [1, 1.12, 1] : 1,
                x: showWrong ? [0, -8, 8, -6, 6, 0] : 0,
              }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelect(letterId)}
              whileTap={result === 'pending' ? { scale: 0.95 } : {}}
              className={`
                rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all
                ${cardClass}
                ${result === 'pending' ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className="text-5xl">{word.emoji}</span>
              <span className={`text-2xl font-arabic ${showCorrect || revealCorrect || showWrong ? 'text-white' : 'text-gray-800'}`} dir="rtl">
                {word.arabic}
              </span>
              <span className={`text-sm ${showCorrect || revealCorrect || showWrong ? 'text-white/80' : 'text-gray-500'}`}>
                {word.meaning}
              </span>
              {showCorrect && <span className="text-xl">✅</span>}
              {showWrong && <span className="text-xl">❌</span>}
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={correctLetter.examples[0]?.arabic}
        onContinue={onContinue}
      />
    </div>
  )
}
