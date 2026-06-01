import { motion, AnimatePresence } from 'framer-motion'
import { HEARTS_MAX } from '@/data/constants'

interface Props {
  hearts: number
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

export function HeartBar({ hearts, size = 'md' }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: HEARTS_MAX }).map((_, i) => (
        <AnimatePresence key={i} mode="wait">
          {i < hearts ? (
            <motion.span
              key="full"
              layoutId={`heart-${i}`}
              className={sizeMap[size]}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }}
            >
              ❤️
            </motion.span>
          ) : (
            <motion.span
              key="empty"
              className={`${sizeMap[size]} opacity-30`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              🤍
            </motion.span>
          )}
        </AnimatePresence>
      ))}
    </div>
  )
}
