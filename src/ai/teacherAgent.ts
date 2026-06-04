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

export async function getTeacherFeedback(ctx: TeacherContext): Promise<TeacherFeedback> {
  try {
    const res = await fetch('/api/teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    })
    if (!res.ok) return pickFallback(ctx)
    const data = await res.json()
    if (data.arabicMessage && data.englishMessage) return data as TeacherFeedback
    return pickFallback(ctx)
  } catch {
    return pickFallback(ctx)
  }
}

function pickFallback(ctx: TeacherContext): TeacherFeedback {
  const idx = ctx.sessionWrongCount % FALLBACK_RESPONSES.length
  return FALLBACK_RESPONSES[idx]
}
