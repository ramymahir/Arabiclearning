import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types'

interface ProfileStore {
  profiles: Profile[]
  activeProfileId: string | null
  addProfile: (name: string, avatar: number) => string
  removeProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void
  updateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar'>>) => void
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      addProfile(name, avatar) {
        const id = crypto.randomUUID()
        set((s) => ({
          profiles: [
            ...s.profiles,
            { id, name, avatar, createdAt: Date.now() },
          ],
        }))
        return id
      },

      removeProfile(id) {
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
        }))
      },

      setActiveProfile(id) {
        set({ activeProfileId: id })
      },

      updateProfile(id, updates) {
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
      },
    }),
    { name: 'noor_profiles' }
  )
)
