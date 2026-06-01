import { motion } from 'framer-motion'

interface Props {
  total: number
  current: number
}

export function ExerciseProgress({ total, current }: Props) {
  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-primary rounded-full"
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}
