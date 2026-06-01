export interface Profile {
  id: string
  name: string
  avatar: number
  createdAt: number
}

export interface LessonProgress {
  lessonId: number
  stars: number
  bestXP: number
  completedAt: number
  attempts: number
}

export interface ProfileProgress {
  profileId: string
  totalXP: number
  level: number
  streak: number
  lastActiveDate: string
  hearts: number
  heartsLastRefillTime: number
  lessons: Record<number, LessonProgress>
}
