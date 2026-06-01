import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Lesson } from '@/types'
import type { LessonProgress } from '@/types'
import { StarRating } from '@/components/ui/StarRating'
import { UNIT_COLORS } from '@/data/constants'

interface Props {
  lesson: Lesson
  progress: LessonProgress | null
  unlocked: boolean
  isCurrent: boolean
  position: 'left' | 'center' | 'right'
}

export function PathNode({ lesson, progress, unlocked, isCurrent, position }: Props) {
  const navigate = useNavigate()
  const colors = UNIT_COLORS[lesson.unitId]
  const stars = progress?.stars ?? 0
  const done = stars >= 1

  const posClass = position === 'left' ? 'ml-4' : position === 'right' ? 'mr-4 self-end' : 'self-center'

  return (
    <div className={`flex flex-col items-center gap-1 ${posClass}`}>
      <motion.button
        whileTap={unlocked ? { scale: 0.9 } : {}}
        animate={isCurrent ? { scale: [1, 1.07, 1], transition: { repeat: Infinity, duration: 2 } } : {}}
        onClick={() => unlocked && navigate(`/lesson/${lesson.id}`)}
        className={`
          w-20 h-20 rounded-full flex flex-col items-center justify-center
          border-4 shadow-lg transition-all relative
          ${unlocked
            ? done
              ? `${colors.bg} border-white text-white`
              : `${colors.bg} border-white text-white ${isCurrent ? 'ring-4 ring-offset-2 ring-white/60' : ''}`
            : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {!unlocked ? (
          <span className="text-2xl">🔒</span>
        ) : done ? (
          <>
            <span className="text-3xl">{lesson.isReview ? '🏆' : '✅'}</span>
          </>
        ) : (
          <span className="text-2xl font-bold">{lesson.id}</span>
        )}

        {isCurrent && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white/50"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {done && <StarRating stars={stars} size="sm" />}

      <span className="text-xs text-center font-semibold text-gray-600 max-w-[80px]">
        <span className="font-arabic text-sm block">{lesson.titleArabic}</span>
      </span>
    </div>
  )
}
