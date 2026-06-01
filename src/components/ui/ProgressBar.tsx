import { motion } from 'framer-motion'

interface Props {
  value: number
  max: number
  color?: string
  height?: string
  className?: string
}

export function ProgressBar({ value, max, color = 'bg-primary', height = 'h-3', className = '' }: Props) {
  const pct = Math.min(1, value / Math.max(1, max))
  return (
    <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className={`${height} ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}
