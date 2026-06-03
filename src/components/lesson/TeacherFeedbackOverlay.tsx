import { motion, AnimatePresence } from 'framer-motion'
import type { TeacherFeedback } from '@/ai/teacherAgent'

interface Props {
  feedback: TeacherFeedback | null
  onDismiss: () => void
}

export function TeacherFeedbackOverlay({ feedback, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {feedback && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/25 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="bg-white rounded-t-3xl p-6 pb-10 shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                {/* drag handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />

                <span className="text-5xl mt-1">{feedback.emoji}</span>

                <p className="text-2xl font-arabic text-gray-800 text-center leading-relaxed" dir="rtl">
                  {feedback.arabicMessage}
                </p>

                <p className="text-gray-500 text-center text-sm">{feedback.englishMessage}</p>

                {feedback.hint && (
                  <div className="w-full bg-amber-50 rounded-2xl p-3 text-center">
                    <p className="text-amber-700 text-xs font-medium">💡 {feedback.hint}</p>
                  </div>
                )}

                <button
                  onClick={onDismiss}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-md mt-2"
                >
                  Got it! Keep going →
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
