import type { ExerciseType } from '@/types'

export interface TeacherFeedback {
  arabicMessage: string
  englishMessage: string
  hint: string
  shouldRepeat: boolean
  emoji: string
}

export interface TeacherContext {
  letterId: string
  letterArabic: string
  transliteration: string
  phonemeDescription: string
  childAttempt: string
  exerciseType: ExerciseType
  previousAttempts: number
  weakLetters: string[]
  sessionWrongCount: number
  letterAccuracy?: number
  studentLevel?: 'beginner' | 'explorer' | 'star'
  totalLessonsCompleted?: number
}

const FALLBACK_RESPONSES: TeacherFeedback[] = [
  {
    arabicMessage: 'أحسنت! حاول مرة أخرى',
    englishMessage: "Good try! Let's try again",
    hint: 'Take your time — you can do it!',
    shouldRepeat: true,
    emoji: '💪',
  },
  {
    arabicMessage: 'تقريباً! حاول مجدداً',
    englishMessage: 'Almost there! Try once more',
    hint: 'Listen carefully and try again',
    shouldRepeat: true,
    emoji: '🌟',
  },
  {
    arabicMessage: 'لا بأس! استمر',
    englishMessage: "That's okay! Keep going",
    hint: "Every mistake helps you learn",
    shouldRepeat: false,
    emoji: '🎯',
  },
]

function cacheKey(ctx: TeacherContext): string {
  return `noor_teach_${ctx.letterId}_${ctx.exerciseType}`
}

export async function getTeacherFeedback(ctx: TeacherContext): Promise<TeacherFeedback> {
  try {
    const res = await fetch('/api/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    })
    if (!res.ok) return getCachedOrFallback(ctx)
    const data = await res.json()
    if (data.arabicMessage && data.englishMessage) {
      try { localStorage.setItem(cacheKey(ctx), JSON.stringify(data)) } catch {}
      return data as TeacherFeedback
    }
    return getCachedOrFallback(ctx)
  } catch {
    return getCachedOrFallback(ctx)
  }
}

function getCachedOrFallback(ctx: TeacherContext): TeacherFeedback {
  try {
    const cached = localStorage.getItem(cacheKey(ctx))
    if (cached) return JSON.parse(cached) as TeacherFeedback
  } catch {}
  return pickFallback(ctx)
}

function pickFallback(ctx: TeacherContext): TeacherFeedback {
  const idx = ctx.sessionWrongCount % FALLBACK_RESPONSES.length
  return FALLBACK_RESPONSES[idx]
}
