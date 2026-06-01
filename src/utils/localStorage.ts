import type { Profile, ProfileProgress } from '@/types'

const KEYS = {
  PROFILES: 'noor_profiles',
  PROGRESS: 'noor_progress',
  ACTIVE_PROFILE: 'noor_active_profile',
} as const

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full — silently fail
  }
}

export const saveProfiles = (profiles: Profile[]) => safeSet(KEYS.PROFILES, profiles)
export const loadProfiles = (): Profile[] => safeGet<Profile[]>(KEYS.PROFILES, [])

export const saveProgress = (progress: Record<string, ProfileProgress>) =>
  safeSet(KEYS.PROGRESS, progress)
export const loadProgress = (): Record<string, ProfileProgress> =>
  safeGet<Record<string, ProfileProgress>>(KEYS.PROGRESS, {})

export const saveActiveProfile = (id: string | null) => safeSet(KEYS.ACTIVE_PROFILE, id)
export const loadActiveProfile = (): string | null =>
  safeGet<string | null>(KEYS.ACTIVE_PROFILE, null)
