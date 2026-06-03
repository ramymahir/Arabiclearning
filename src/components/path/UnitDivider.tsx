import { motion } from 'framer-motion'
import type { LessonUnit } from '@/types'
import { UNIT_COLORS } from '@/data/constants'

interface Props {
  unit: LessonUnit
}

// Decorative emoji per unit (cycles if more units than emojis)
const UNIT_EMOJIS = ['✨', '🌟', '🎯', '🚀', '💫', '🎪', '🌈', '🏆']

export function UnitDivider({ unit }: Props) {
  const colors = UNIT_COLORS[unit.id]
  const emoji = UNIT_EMOJIS[(unit.id - 1) % UNIT_EMOJIS.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`${colors.bg} rounded-3xl py-5 px-6 mx-4 my-3 shadow-xl`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-bold text-xl text-white">{unit.title}</div>
          <div className="text-white/80 text-sm mt-0.5">{unit.description}</div>
          <div className="text-3xl font-arabic text-white/90 mt-1" dir="rtl">
            {unit.titleArabic}
          </div>
        </div>
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3, delay: unit.id * 0.3 }}
          className="text-5xl ml-4 flex-shrink-0"
        >
          {emoji}
        </motion.div>
      </div>
    </motion.div>
  )
}
