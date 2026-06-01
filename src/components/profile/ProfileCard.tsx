import { motion } from 'framer-motion'
import type { Profile } from '@/types'
import type { ProfileProgress } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { StarRating } from '@/components/ui/StarRating'
import { TOTAL_LESSONS } from '@/data/constants'

interface Props {
  profile: Profile
  progress: ProfileProgress
  onSelect: () => void
  onDelete: () => void
}

export function ProfileCard({ profile, progress, onSelect, onDelete }: Props) {
  const completedLessons = Object.values(progress.lessons).filter((l) => l.stars >= 1).length
  const pct = Math.round((completedLessons / TOTAL_LESSONS) * 100)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative bg-white rounded-3xl p-5 border-2 border-border shadow-sm cursor-pointer select-none"
      onClick={onSelect}
    >
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-hearts text-xl leading-none p-1"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        ×
      </button>

      <div className="flex items-center gap-4">
        <Avatar avatarId={profile.avatar} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xl truncate">{profile.name}</div>
          <div className="text-sm text-gray-500">Level {progress.level} · {progress.totalXP} XP</div>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-1">{completedLessons}/{TOTAL_LESSONS} lessons · {pct}%</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <span className="text-sm">🔥 {progress.streak} day streak</span>
        <span className="text-sm">❤️ {progress.hearts} hearts</span>
      </div>
    </motion.div>
  )
}
