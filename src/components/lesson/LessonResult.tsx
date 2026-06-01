import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/Button'
import { Confetti } from '@/components/ui/Confetti'
import { useAudio } from '@/hooks/useAudio'
import { useGameStore } from '@/store/gameStore'

interface Props {
  stars: number
  xpEarned: number
  lessonId: number
  leveledUp: boolean
  onRetry: () => void
}

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

  const messages = {
    3: ['🎉 Perfect!', 'Amazing job!', 'You nailed it!'],
    2: ['🌟 Great!', 'Well done!', 'Keep going!'],
    1: ['💪 Good try!', 'You did it!', 'Practice more!'],
    0: ['😅 Try again!', "You'll get it!"],
  }
  const msgs = messages[Math.min(3, stars) as keyof typeof messages] ?? messages[1]
  const title = msgs[0]
  const subtitle = msgs[1]

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 relative">
      {showConfetti && <Confetti />}

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-center"
      >
        <motion.div
          className="text-7xl mb-4"
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stars === 3 ? '🏆' : stars >= 2 ? '🌟' : '📖'}
        </motion.div>

        <h1 className="text-4xl font-bold mb-1">{title}</h1>
        <p className="text-gray-500 text-lg mb-6">{subtitle}</p>

        <StarRating stars={stars} size="lg" animate />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 bg-xp/15 border-2 border-xp rounded-2xl px-8 py-4"
        >
          <div className="text-3xl font-bold text-yellow-600">+{xpEarned} XP</div>
          <div className="text-sm text-yellow-700">Earned this lesson</div>
        </motion.div>

        {leveledUp && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
            className="mt-4 bg-primary/10 border-2 border-primary rounded-2xl px-6 py-3"
          >
            <div className="text-2xl font-bold text-primary">🎖️ LEVEL UP!</div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="w-full mt-10 flex flex-col gap-3"
      >
        <Button onClick={() => navigate('/home')} fullWidth className="text-xl py-4">
          Continue 🗺️
        </Button>
        <Button onClick={onRetry} variant="ghost" fullWidth>
          Try again
        </Button>
      </motion.div>
    </div>
  )
}
