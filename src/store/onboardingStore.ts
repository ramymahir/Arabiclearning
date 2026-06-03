import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingStore {
  completed: Record<string, boolean>       // profileId → has done onboarding
  placementLevel: Record<string, number>   // profileId → 0=beginner, 1=explorer, 2=star

  markCompleted(profileId: string, level: number): void
  hasCompleted(profileId: string): boolean
  getLevel(profileId: string): number
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      completed: {},
      placementLevel: {},

      markCompleted(profileId, level) {
        set((s) => ({
          completed: { ...s.completed, [profileId]: true },
          placementLevel: { ...s.placementLevel, [profileId]: level },
        }))
      },

      hasCompleted(profileId) {
        return get().completed[profileId] === true
      },

      getLevel(profileId) {
        return get().placementLevel[profileId] ?? 0
      },
    }),
    { name: 'noor_onboarding' }
  )
)
