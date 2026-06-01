import { useEffect } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { PathScreen } from '@/components/path/PathScreen'

export function HomePage() {
  const activeId = useProfileStore((s) => s.activeProfileId)!
  const checkHeartRefill = useProgressStore((s) => s.checkHeartRefill)

  useEffect(() => {
    checkHeartRefill(activeId)
  }, [activeId])

  return <PathScreen />
}
