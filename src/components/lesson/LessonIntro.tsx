import { motion } from 'framer-motion'
import type { Lesson } from '@/types'
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Hero card */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`w-full rounded-3xl p-8 text-white text-center shadow-2xl ${colors.bg}`}
      >
        {/* Big emoji or letter preview */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="text-7xl mb-4"
        >
          {lesson.isReview ? '🏆' : '📚'}
        </motion.div>

        {/* Unit label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-bold opacity-80 mb-2 uppercase tracking-widest"
        >
          {unit.title}
        </motion.div>

        {/* Arabic title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-arabic font-bold text-white mb-1"
          dir="rtl"
        >
          {lesson.titleArabic}
        </motion.div>

        {/* English title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-bold text-2xl mb-2"
        >
          {lesson.title}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-white/80 text-sm mb-5"
        >
          {lesson.description}
        </motion.div>

        {/* Letter preview tiles */}
        {letters.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap mb-5">
            {letters.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 300 }}
                className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center shadow-sm"
              >
                <span className="text-2xl font-arabic text-white" dir="rtl">{l.arabic}</span>
              </motion.div>
            ))}
            {lesson.letterIds.length > 6 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.82 }}
                className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-sm"
              >
                +{lesson.letterIds.length - 6}
              </motion.div>
            )}
          </div>
        )}

        {/* Stats badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 flex-wrap"
        >
          <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
            ✨ {lesson.exercises.length} exercises
          </span>
          <span className="inline-flex items-center gap-1 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
            ⭐ {lesson.xpReward} XP
          </span>
        </motion.div>
      </motion.div>

      {/* Let's Go button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full mt-6"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl p-5 text-2xl shadow-xl"
        >
          Let&apos;s Go! 🚀
        </motion.button>
      </motion.div>
    </div>
  )
}
