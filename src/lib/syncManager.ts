import { readEntity, writeEntity } from './braincloud'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useAdaptiveStore } from '@/store/adaptiveStore'
import { useOnboardingStore } from '@/store/onboardingStore'

const ENTITY_PROFILES   = 'profiles'
const ENTITY_PROGRESS   = 'progress'
const ENTITY_ADAPTIVE   = 'adaptive'
const ENTITY_ONBOARDING = 'onboarding'

/**
 * Pull all cloud entities and merge into local Zustand stores.
 * Strategy: cloud wins when local has no data; local wins when data already exists.
 * This lets offline sessions keep their state while restoring on a fresh install.
 */
export async function pullFromCloud(): Promise<void> {
  try {
    const [profiles, progress, adaptive, onboarding] = await Promise.all([
      readEntity<{ profiles: unknown[]; activeProfileId: string | null }>(ENTITY_PROFILES),
      readEntity<{ data: unknown }>(ENTITY_PROGRESS),
      readEntity<{ data: unknown }>(ENTITY_ADAPTIVE),
      readEntity<{ completed: unknown; placementLevel: unknown }>(ENTITY_ONBOARDING),
    ])

    const profileState = useProfileStore.getState()
    if (profiles && profileState.profiles.length === 0) {
      useProfileStore.setState({
        profiles: profiles.profiles as never,
        activeProfileId: profiles.activeProfileId,
      })
    }

    const progressState = useProgressStore.getState()
    if (progress && Object.keys((progressState as { data: Record<string, unknown> }).data).length === 0) {
      useProgressStore.setState({ data: (progress as { data: Record<string, unknown> }).data as never })
    }

    const adaptiveState = useAdaptiveStore.getState()
    if (adaptive && Object.keys((adaptiveState as { data: Record<string, unknown> }).data).length === 0) {
      useAdaptiveStore.setState({ data: (adaptive as { data: Record<string, unknown> }).data as never })
    }

    if (onboarding) {
      const onboardingState = useOnboardingStore.getState()
      const hasLocal = Object.keys((onboardingState as { completed: Record<string, boolean> }).completed).length > 0
      if (!hasLocal) {
        useOnboardingStore.setState({
          completed: onboarding.completed as never,
          placementLevel: onboarding.placementLevel as never,
        })
      }
    }
  } catch (err) {
    // Network or auth failure — continue with local data silently
    console.warn('[BC] pullFromCloud failed:', err)
  }
}

/**
 * Push all local store state to BrainCloud.
 * Called after lesson completion and on profile changes.
 */
export async function pushToCloud(): Promise<void> {
  try {
    const { profiles, activeProfileId } = useProfileStore.getState()
    const { data: progressData } = useProgressStore.getState() as { data: unknown }
    const { data: adaptiveData } = useAdaptiveStore.getState() as { data: unknown }
    const { completed, placementLevel } = useOnboardingStore.getState() as { completed: unknown; placementLevel: unknown }

    await Promise.all([
      writeEntity(ENTITY_PROFILES,   { profiles, activeProfileId }),
      writeEntity(ENTITY_PROGRESS,   { data: progressData }),
      writeEntity(ENTITY_ADAPTIVE,   { data: adaptiveData }),
      writeEntity(ENTITY_ONBOARDING, { completed, placementLevel }),
    ])
  } catch (err) {
    console.warn('[BC] pushToCloud failed:', err)
  }
}
