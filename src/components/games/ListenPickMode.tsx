import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult } from '@/types'
import { getLetterById, getLettersByIds } from '@/data/letters'
import { ArabicText } from '@/components/ui/ArabicText'
import { AnswerFeedback } from './AnswerFeedback'
import { OptionButton } from './OptionButton'
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

export function ListenPickMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const correctLetter = getLetterById(exercise.correctAnswer)!
  const allOptions = shuffle([
    exercise.correctAnswer,
    ...exercise.distractors.slice(0, 3),
  ])
  const optionLetters = getLettersByIds(allOptions)

  useEffect(() => {
    if (correctLetter) {
      const t = setTimeout(() => playLetter(correctLetter), 300)
      return () => clearTimeout(t)
    }
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

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-36">
      <div className="text-center font-bold text-gray-600 text-lg mb-2">
        What letter makes this sound?
      </div>

      {/* Speaker button */}
      <motion.button
        onClick={() => playLetter(correctLetter)}
        whileTap={{ scale: 0.92 }}
        className="w-28 h-28 rounded-full bg-sky flex items-center justify-center shadow-lg shadow-sky/30 mb-8 mt-4"
      >
        <motion.span
          className="text-5xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          🔊
        </motion.span>
      </motion.button>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {optionLetters.map((letter) => (
          <OptionButton
            key={letter.id}
            arabic={applyHarakah(letter.arabic, harakah)}
            isCorrect={letter.id === exercise.correctAnswer}
            isSelected={selected === letter.id}
            result={result}
            onClick={() => handleSelect(letter.id)}
            disabled={result !== 'pending'}
          />
        ))}
      </div>

      <AnswerFeedback
        result={result}
        correctText={applyHarakah(correctLetter.arabic, harakah)}
        onContinue={onContinue}
      />
    </div>
  )
}
