import { motion } from 'framer-motion'

interface Props {
  stars: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

const sizeMap = { sm: 'text-lg', md: 'text-3xl', lg: 'text-5xl' }

export function StarRating({ stars, max = 3, size = 'md', animate: doAnimate = false }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <motion.span
          key={i}
          className={sizeMap[size]}
          initial={doAnimate ? { scale: 0, rotate: -30 } : {}}
          animate={doAnimate ? { scale: 1, rotate: 0 } : {}}
          transition={doAnimate ? { delay: i * 0.25, type: 'spring', stiffness: 400 } : {}}
        >
          {i < stars ? '⭐' : '☆'}
        </motion.span>
      ))}
    </div>
  )
}
