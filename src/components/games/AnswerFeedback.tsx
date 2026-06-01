import { motion, AnimatePresence } from 'framer-motion'
import type { AnswerResult } from '@/types'
import { Button } from '@/components/ui/Button'

interface Props {
  result: AnswerResult
  correctText?: string
  onContinue: () => void
}

export function AnswerFeedback({ result, correctText, onContinue }: Props) {
  if (result === 'pending') return null

  const isCorrect = result === 'correct'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`
          fixed bottom-0 left-0 right-0 z-40 pb-safe
          ${isCorrect ? 'bg-correct/10 border-t-4 border-correct' : 'bg-wrong/10 border-t-4 border-wrong'}
          px-4 pt-5 pb-6
        `}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className={`font-bold text-xl ${isCorrect ? 'text-correct' : 'text-wrong'}`}>
              {isCorrect ? '🎉 Correct!' : '😅 Not quite!'}
            </div>
            {!isCorrect && correctText && (
              <div className="text-gray-600 text-sm mt-1">
                Correct: <span className="font-arabic text-lg">{correctText}</span>
              </div>
            )}
          </div>
          <Button
            onClick={onContinue}
            variant={isCorrect ? 'primary' : 'danger'}
            className="min-w-[110px]"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
