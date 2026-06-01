import { motion } from 'framer-motion'
import type { Lesson } from '@/types'
import { ArabicText } from '@/components/ui/ArabicText'
import { Button } from '@/components/ui/Button'
import { UNIT_COLORS } from '@/data/constants'
import { LESSON_UNITS } from '@/data/lessons'
import { getLettersByIds } from '@/data/letters'

interface Props {
  lesson: Lesson
  onStart: () => void
}

export function LessonIntro({ lesson, onStart }: Props) {
  const unit = LESSON_UNITS.find((u) => u.id === lesson.unitId)!
  const colors = UNIT_COLORS[lesson.unitId]
  const letters = getLettersByIds(lesson.letterIds.slice(0, 6))

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`w-full rounded-3xl p-8 text-white text-center shadow-2xl ${colors.bg}`}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl mb-4"
        >
          {lesson.isReview ? '🏆' : '📚'}
        </motion.div>

        <div className="text-sm font-bold opacity-80 mb-1 uppercase tracking-wide">
          {unit.title}
        </div>
        <ArabicText size="3xl" className="block text-white mb-2">
          {lesson.titleArabic}
        </ArabicText>
        <div className="font-bold text-xl mb-3">{lesson.title}</div>
        <div className="text-white/80 text-sm">{lesson.description}</div>

        {/* Letter preview */}
        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          {letters.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <ArabicText size="2xl" className="text-white">{l.arabic}</ArabicText>
            </motion.div>
          ))}
          {lesson.letterIds.length > 6 && (
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
              +{lesson.letterIds.length - 6}
            </div>
          )}
        </div>

        <div className="mt-4 text-white/70 text-sm">
          {lesson.exercises.length} exercises · {lesson.xpReward} XP reward
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full mt-6"
      >
        <Button onClick={onStart} fullWidth className="text-xl py-5">
          Start Lesson! 🚀
        </Button>
      </motion.div>
    </div>
  )
}
