import { motion } from 'framer-motion'
import { LEVEL_THRESHOLDS, LEVEL_NAMES } from '@/data/constants'

interface Props {
  totalXP: number
  level: number
  compact?: boolean
}

export function XPBar({ totalXP, level, compact = false }: Props) {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progress = Math.min(1, (totalXP - currentThreshold) / (nextThreshold - currentThreshold))
  const levelName = LEVEL_NAMES[level - 1] ?? 'Legend'

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xp font-bold text-sm">⭐ {totalXP}</span>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-xp rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-gray-500">Level {level} · {levelName}</span>
        <span className="text-xs font-bold text-xp">{totalXP} XP</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-xp rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{currentThreshold}</span>
        <span className="text-xs text-gray-400">{nextThreshold}</span>
      </div>
    </div>
  )
}
