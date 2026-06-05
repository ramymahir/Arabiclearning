import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProfileProgress, LessonProgress } from '@/types'
import { HEARTS_MAX, HEART_REFILL_MINUTES, LEVEL_THRESHOLDS, LESSON_COMPLETE_XP, STREAK_BONUS_XP } from '@/data/constants'
import { todayStr, yesterdayStr, minutesSince } from '@/utils/date'

const defaultProgress = (profileId: string): ProfileProgress => ({
  profileId,
  totalXP: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  hearts: HEARTS_MAX,
  heartsLastRefillTime: Date.now(),
  lessons: {},
})

function calcLevel(xp: number): number {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  return level
}

interface ProgressStore {
  data: Record<string, ProfileProgress>
  getProgress: (profileId: string) => ProfileProgress
  getLessonProgress: (profileId: string, lessonId: number) => LessonProgress | null
  isLessonUnlocked: (profileId: string, lessonId: number) => boolean
  completeLesson: (profileId: string, lessonId: number, wrongCount: number) => { stars: number; xpEarned: number; leveledUp: boolean }
  deductHeart: (profileId: string) => void
  refillHearts: (profileId: string) => void
  checkHeartRefill: (profileId: string) => void
  updateStreak: (profileId: string) => void
  initProfile: (profileId: string) => void
  applyPlacementLevel: (profileId: string, level: number) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      data: {},

      getProgress(profileId) {
        return get().data[profileId] ?? defaultProgress(profileId)
      },

      getLessonProgress(profileId, lessonId) {
        return get().getProgress(profileId).lessons[lessonId] ?? null
      },

      isLessonUnlocked(_profileId, _lessonId) {
        return true
      },

      completeLesson(profileId, lessonId, wrongCount) {
        const stars = wrongCount <= 1 ? 3 : wrongCount <= 3 ? 2 : 1
        const baseXP = LESSON_COMPLETE_XP[stars]
        const progress = get().getProgress(profileId)
        const existing = progress.lessons[lessonId]
        const attempts = (existing?.attempts ?? 0) + 1

        // streak bonus
        const today = todayStr()
        const streakBonus =
          progress.lastActiveDate === yesterdayStr() || progress.lastActiveDate === today
            ? (progress.streak >= 3 ? STREAK_BONUS_XP : 0)
            : 0
        const xpEarned = baseXP + streakBonus

        const newTotalXP = progress.totalXP + xpEarned
        const newLevel = calcLevel(newTotalXP)
        const leveledUp = newLevel > progress.level

        set((s) => ({
          data: {
            ...s.data,
            [profileId]: {
              ...progress,
              totalXP: newTotalXP,
              level: newLevel,
              lessons: {
                ...progress.lessons,
                [lessonId]: {
                  lessonId,
                  stars: Math.max(stars, existing?.stars ?? 0),
                  bestXP: Math.max(xpEarned, existing?.bestXP ?? 0),
                  completedAt: Date.now(),
                  attempts,
                },
              },
            },
          },
        }))

        get().updateStreak(profileId)
        return { stars, xpEarned, leveledUp }
      },

      deductHeart(profileId) {
        const p = get().getProgress(profileId)
        if (p.hearts <= 0) return
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: { ...p, hearts: Math.max(0, p.hearts - 1) },
          },
        }))
      },

      refillHearts(profileId) {
        const p = get().getProgress(profileId)
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: { ...p, hearts: HEARTS_MAX, heartsLastRefillTime: Date.now() },
          },
        }))
      },

      checkHeartRefill(profileId) {
        const p = get().getProgress(profileId)
        if (p.hearts >= HEARTS_MAX) return
        const elapsed = minutesSince(p.heartsLastRefillTime)
        const refills = Math.floor(elapsed / HEART_REFILL_MINUTES)
        if (refills <= 0) return
        const newHearts = Math.min(HEARTS_MAX, p.hearts + refills)
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: {
              ...p,
              hearts: newHearts,
              heartsLastRefillTime: p.heartsLastRefillTime + refills * HEART_REFILL_MINUTES * 60000,
            },
          },
        }))
      },

      updateStreak(profileId) {
        const p = get().getProgress(profileId)
        const today = todayStr()
        const yesterday = yesterdayStr()
        let newStreak = p.streak
        if (p.lastActiveDate === today) {
          return // already updated today
        } else if (p.lastActiveDate === yesterday) {
          newStreak += 1
        } else {
          newStreak = 1
        }
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: { ...p, streak: newStreak, lastActiveDate: today },
          },
        }))
      },

      initProfile(profileId) {
        const existing = get().data[profileId]
        if (!existing) {
          set((s) => ({
            data: { ...s.data, [profileId]: defaultProgress(profileId) },
          }))
        }
      },

      applyPlacementLevel(profileId, level) {
        get().initProfile(profileId)
        if (level === 0) return // beginner: only lesson 1 unlocked by default

        const maxLesson = level === 1 ? 5 : 10
        const progress = get().getProgress(profileId)
        const newLessons = { ...progress.lessons }
        const now = Date.now()

        for (let lessonId = 1; lessonId <= maxLesson; lessonId++) {
          if (!newLessons[lessonId]) {
            newLessons[lessonId] = {
              lessonId,
              stars: 1,
              bestXP: 20,
              completedAt: now,
              attempts: 1,
            }
          }
        }

        set((s) => ({
          data: {
            ...s.data,
            [profileId]: {
              ...progress,
              lessons: newLessons,
            },
          },
        }))
      },
    }),
    { name: 'noor_progress' }
  )
)
