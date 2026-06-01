import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult, Harakah } from '@/types'
import { getLetterById, getLettersByIds } from '@/data/letters'
import { ArabicText } from '@/components/ui/ArabicText'
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

export function MatchMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playWord, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const correctLetter = getLetterById(exercise.correctAnswer)!
  const allOptionIds = shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)])
  const optionLetters = getLettersByIds(allOptionIds)

  // Word options: each distractor letter's first example word, plus correct letter's example
  const wordOptions = shuffle(
    optionLetters.map((l) => ({
      letterId: l.id,
      word: l.examples[0],
    }))
  )

  useEffect(() => {
    const t = setTimeout(() => playLetter(correctLetter), 200)
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
    <div className="flex flex-col items-center px-4 pt-4 pb-36">
      <div className="text-center font-bold text-gray-600 text-lg mb-4">
        Match the letter to its word!
      </div>

      {/* Letter prompt card */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-40 h-40 rounded-3xl bg-white border-4 border-primary shadow-xl flex flex-col items-center justify-center mb-8 cursor-pointer"
        onClick={() => playLetter(correctLetter)}
      >
        <ArabicText size="7xl" className="text-gray-800 leading-none">
          {applyHarakah(correctLetter.arabic, harakah)}
        </ArabicText>
        <span className="text-sky text-xl mt-1">🔊</span>
      </motion.div>

      {/* Word option cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {wordOptions.map(({ letterId, word }, i) => {
          const isCorrect = letterId === exercise.correctAnswer
          const isSelected = selected === letterId
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          return (
            <motion.button
              key={letterId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelect(letterId)}
              whileTap={result === 'pending' ? { scale: 0.95 } : {}}
              className={`
                rounded-2xl p-4 flex flex-col items-center gap-2 border-2 border-b-4 transition-all
                ${showCorrect ? 'border-correct bg-correct/10' : ''}
                ${showWrong ? 'border-wrong bg-wrong/10' : ''}
                ${revealCorrect ? 'border-correct/50 bg-correct/5' : ''}
                ${!isSelected && result === 'pending' ? 'border-border bg-white hover:border-gray-300 cursor-pointer' : ''}
                ${!isSelected && result !== 'pending' && !revealCorrect ? 'border-border bg-white opacity-50' : ''}
              `}
            >
              <span className="text-4xl">{word.emoji}</span>
              <ArabicText size="xl">{word.arabic}</ArabicText>
              <span className="text-xs text-gray-500">{word.meaning}</span>
              {showCorrect && <span>✅</span>}
              {showWrong && <span>❌</span>}
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
