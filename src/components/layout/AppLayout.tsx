import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { audioManager } from '@/audio/audioManager'
import { TopNav } from './TopNav'

export function AppLayout() {
  const navigate = useNavigate()
  const activeId = useProfileStore((s) => s.activeProfileId)
  const checkHeartRefill = useProgressStore((s) => s.checkHeartRefill)
  const initProfile = useProgressStore((s) => s.initProfile)

  useEffect(() => {
    if (!activeId) {
      navigate('/', { replace: true })
      return
    }
    initProfile(activeId)
    checkHeartRefill(activeId)
    audioManager.init()
  }, [activeId])

  if (!activeId) return null

  return (
    <div className="min-h-screen bg-surface font-ui">
      <TopNav />
      <main className="max-w-md mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
