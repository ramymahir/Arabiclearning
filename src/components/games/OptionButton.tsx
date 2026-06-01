import { motion } from 'framer-motion'
import type { AnswerResult } from '@/types'
import { ArabicText } from '@/components/ui/ArabicText'

interface Props {
  arabic: string
  isCorrect: boolean
  isSelected: boolean
  result: AnswerResult
  onClick: () => void
  disabled: boolean
}

export function OptionButton({ arabic, isCorrect, isSelected, result, onClick, disabled }: Props) {
  const showCorrect = isSelected && result === 'correct'
  const showWrong = isSelected && result === 'wrong'
  const revealCorrect = !isSelected && isCorrect && result === 'wrong'

  return (
    <motion.button
      onClick={() => !disabled && onClick()}
      animate={showWrong ? { x: [0, -10, 10, -8, 8, 0], transition: { duration: 0.4 } } : {}}
      whileTap={!disabled ? { scale: 0.94 } : {}}
      className={`
        w-full rounded-2xl border-3 border-b-4 py-4 px-3 text-center transition-colors select-none
        ${showCorrect ? 'bg-correct/15 border-correct text-correct' : ''}
        ${showWrong ? 'bg-wrong/15 border-wrong text-wrong' : ''}
        ${revealCorrect ? 'bg-correct/10 border-correct/50 text-correct/80' : ''}
        ${!isSelected && result === 'pending' ? 'bg-white border-border text-gray-800 hover:bg-gray-50 hover:border-gray-300 cursor-pointer' : ''}
        ${!isSelected && result !== 'pending' && !revealCorrect ? 'bg-white border-border text-gray-400 opacity-60' : ''}
      `}
      style={{ borderBottomWidth: 4 }}
    >
      <ArabicText size="4xl" className="block">
        {arabic}
      </ArabicText>
      {showCorrect && <span className="text-xl">✅</span>}
      {showWrong && <span className="text-xl">❌</span>}
    </motion.button>
  )
}
