import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Lesson } from '@/types'
import type { LessonProgress } from '@/types'
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
    <div className={`flex flex-col items-center gap-2 ${posClass}`}>
      {/* Node button */}
      <div className="relative">
        {/* Pulsing ring for current node */}
        {isCurrent && (
          <motion.div
            className={`absolute inset-0 rounded-full ${colors.bg} opacity-40`}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ margin: -8 }}
          />
        )}

        <motion.button
          whileTap={unlocked ? { scale: 0.9 } : {}}
          animate={isCurrent ? { y: [0, -4, 0] } : {}}
          transition={isCurrent ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } : {}}
          onClick={() => unlocked && navigate(`/lesson/${lesson.id}`)}
          className={`
            relative flex flex-col items-center justify-center
            border-4 shadow-xl transition-all
            ${isCurrent ? 'w-20 h-20 rounded-full' : 'w-[72px] h-[72px] rounded-full'}
            ${unlocked
              ? done
                ? `${colors.bg} border-white text-white`
                : `${colors.bg} border-white text-white`
              : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
            }
            ${isCurrent ? 'ring-4 ring-offset-2 ring-white shadow-2xl' : ''}
          `}
        >
          {!unlocked ? (
            <span className="text-2xl">🔒</span>
          ) : done ? (
            <span className="text-3xl">{lesson.isReview ? '🏆' : '✅'}</span>
          ) : (
            <span className="text-2xl font-bold">{lesson.id}</span>
          )}
        </motion.button>
      </div>

      {/* Star dots */}
      {done && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${i < stars ? 'bg-amber-400' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}

      {/* Arabic label */}
      <span className="text-xs text-center font-semibold text-gray-600 max-w-[80px]">
        <span className="font-arabic text-sm block" dir="rtl">{lesson.titleArabic}</span>
      </span>
    </div>
  )
}
