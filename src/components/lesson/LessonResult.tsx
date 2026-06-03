import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Confetti } from '@/components/ui/Confetti'
import { useAudio } from '@/hooks/useAudio'

interface Props {
  stars: number
  xpEarned: number
  lessonId: number
  leveledUp: boolean
  onRetry: () => void
}

const STAR_CONFIGS = [
  { emoji: '⭐', bg: 'from-emerald-400 to-teal-500', title: '💪 Good try!', subtitle: 'Practice makes perfect!' },
  { emoji: '⭐', bg: 'from-blue-400 to-indigo-500', title: '🌟 Great!', subtitle: 'Well done, keep going!' },
  { emoji: '⭐', bg: 'from-blue-400 to-indigo-500', title: '🌟 Great!', subtitle: 'Well done, keep going!' },
  { emoji: '🎉', bg: 'from-amber-400 to-orange-500', title: '🎉 Perfect!', subtitle: 'Amazing job!' },
]

export function LessonResult({ stars, xpEarned, lessonId, leveledUp, onRetry }: Props) {
  const navigate = useNavigate()
  const { playSFX } = useAudio()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (stars === 3) {
      playSFX('complete')
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(t)
    } else {
      playSFX(stars >= 2 ? 'correct' : 'wrong')
    }
  }, [])

  const clampedStars = Math.min(3, Math.max(0, stars))
  const config = STAR_CONFIGS[clampedStars]

  return (
    <div className={`flex flex-col items-center justify-center min-h-[80vh] px-6 relative bg-gradient-to-b ${config.bg} pb-8`}>
      {showConfetti && <Confetti />}

      {/* Main emoji */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0, y: [0, -15, 0] }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 15 },
          y: { repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: 0.5 },
        }}
        className="text-8xl mb-4 mt-8"
      >
        {config.emoji}
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold text-white mb-1 text-center"
      >
        {config.title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-white/80 text-xl mb-6 text-center"
      >
        {config.subtitle}
      </motion.p>

      {/* Stars row */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
        className="flex gap-3 mb-6"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.15, type: 'spring', stiffness: 400, damping: 15 }}
            className={`text-5xl ${i < stars ? '' : 'opacity-30 grayscale'}`}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>

      {/* XP badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-2xl px-8 py-4 text-center mb-4"
      >
        <div className="text-4xl font-bold text-white">+{xpEarned} XP ✨</div>
        <div className="text-sm text-white/80 mt-1">Earned this lesson</div>
      </motion.div>

      {/* Level up badge */}
      {leveledUp && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
          className="bg-white/25 border-2 border-white/50 rounded-2xl px-6 py-3 mb-4 text-center"
        >
          <div className="text-2xl font-bold text-white">🎖️ LEVEL UP!</div>
        </motion.div>
      )}

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full mt-4 flex flex-col gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/home')}
          className="w-full bg-white text-gray-800 font-bold rounded-2xl p-5 text-2xl shadow-xl"
        >
          Continue →
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={onRetry}
          className="w-full bg-white/20 border-2 border-white/40 text-white font-semibold rounded-2xl p-4 text-xl"
        >
          Try Again
        </motion.button>
      </motion.div>
    </div>
  )
}
