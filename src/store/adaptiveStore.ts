import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LetterStat {
  letterId: string
  attempts: number
  correct: number
  speakAttempts: number
  speakCorrect: number
  lastSeen: number
}

const defaultStat = (letterId: string): LetterStat => ({
  letterId,
  attempts: 0,
  correct: 0,
  speakAttempts: 0,
  speakCorrect: 0,
  lastSeen: 0,
})

interface AdaptiveStore {
  data: Record<string, Record<string, LetterStat>>
  recordAttempt: (profileId: string, letterId: string, correct: boolean) => void
  recordSpeakAttempt: (profileId: string, letterId: string, correct: boolean) => void
  getStats: (profileId: string) => LetterStat[]
  getWeakLetters: (profileId: string, limit?: number) => string[]
  resetProfile: (profileId: string) => void
}

export const useAdaptiveStore = create<AdaptiveStore>()(
  persist(
    (set, get) => ({
      data: {},

      recordAttempt(profileId, letterId, correct) {
        const stats = get().data[profileId] ?? {}
        const prev = stats[letterId] ?? defaultStat(letterId)
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: {
              ...stats,
              [letterId]: {
                ...prev,
                attempts: prev.attempts + 1,
                correct: prev.correct + (correct ? 1 : 0),
                lastSeen: Date.now(),
              },
            },
          },
        }))
      },

      recordSpeakAttempt(profileId, letterId, correct) {
        const stats = get().data[profileId] ?? {}
        const prev = stats[letterId] ?? defaultStat(letterId)
        set((s) => ({
          data: {
            ...s.data,
            [profileId]: {
              ...stats,
              [letterId]: {
                ...prev,
                speakAttempts: prev.speakAttempts + 1,
                speakCorrect: prev.speakCorrect + (correct ? 1 : 0),
                lastSeen: Date.now(),
              },
            },
          },
        }))
      },

      getStats(profileId) {
        return Object.values(get().data[profileId] ?? {})
      },

      getWeakLetters(profileId, limit = 3) {
        return get()
          .getStats(profileId)
          .filter((s) => s.attempts >= 2)
          .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
          .slice(0, limit)
          .map((s) => s.letterId)
      },

      resetProfile(profileId) {
        set((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [profileId]: _, ...rest } = s.data
          return { data: rest }
        })
      },
    }),
    { name: 'noor_adaptive' }
  )
)
