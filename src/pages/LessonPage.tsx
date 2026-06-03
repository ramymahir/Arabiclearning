import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { getLessonById } from '@/data/lessons'
import { LessonScreen } from '@/components/lesson/LessonScreen'
import { audioManager } from '@/audio/audioManager'

export function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    audioManager.init()
  }, [])
  const activeId = useProfileStore((s) => s.activeProfileId)
  const isLessonUnlocked = useProgressStore((s) => s.isLessonUnlocked)

  if (!activeId) {
    navigate('/', { replace: true })
    return null
  }

  const lessonId = parseInt(id ?? '0', 10)
  const lesson = getLessonById(lessonId)

  if (!lesson) {
    navigate('/home', { replace: true })
    return null
  }

  if (!isLessonUnlocked(activeId, lessonId)) {
    navigate('/home', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-surface font-ui max-w-md mx-auto">
      <LessonScreen lesson={lesson} />
    </div>
  )
}
