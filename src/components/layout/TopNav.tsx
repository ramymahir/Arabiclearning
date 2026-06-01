import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { HeartBar } from '@/components/ui/HeartBar'
import { StreakBadge } from '@/components/ui/StreakBadge'
import { XPBar } from '@/components/ui/XPBar'
import { Avatar } from '@/components/ui/Avatar'

export function TopNav() {
  const navigate = useNavigate()
  const activeId = useProfileStore((s) => s.activeProfileId)
  const profiles = useProfileStore((s) => s.profiles)
  const profile = profiles.find((p) => p.id === activeId)
  const getProgress = useProgressStore((s) => s.getProgress)
  const progress = activeId ? getProgress(activeId) : null

  if (!profile || !progress) return null

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border px-4 py-2">
      <div className="max-w-md mx-auto flex items-center gap-3">
        <button onClick={() => navigate('/')} className="shrink-0">
          <Avatar avatarId={profile.avatar} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <XPBar totalXP={progress.totalXP} level={progress.level} compact />
        </div>
        <HeartBar hearts={progress.hearts} size="sm" />
        <StreakBadge streak={progress.streak} />
      </div>
    </header>
  )
}
