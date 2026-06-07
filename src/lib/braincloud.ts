import { BrainCloudWrapper } from 'braincloud'

const APP_ID  = import.meta.env.VITE_BC_APP_ID  as string
const SECRET  = import.meta.env.VITE_BC_SECRET   as string
const VERSION = (import.meta.env.VITE_BC_VERSION as string) ?? '1.0.0'

// Wrapper is instantiated once; "noor" is the wrapperName used as localStorage key prefix
const bcw = new BrainCloudWrapper('noor')
bcw.initialize(APP_ID, SECRET, VERSION)

let authPromise: Promise<void> | null = null
let authenticated = false

function ensureAuth(): Promise<void> {
  if (authenticated) return Promise.resolve()
  if (authPromise) return authPromise

  authPromise = new Promise<void>((resolve, reject) => {
    bcw.authenticateAnonymous((result) => {
      if (result.status === 200) {
        authenticated = true
        resolve()
      } else {
        authPromise = null  // allow retry
        reject(new Error(`BrainCloud auth failed (${result.status}): ${result.status_message ?? ''}`))
      }
    })
  })

  return authPromise
}

/**
 * Read a singleton entity for the authenticated user.
 * Returns null if the entity hasn't been written yet.
 */
export async function readEntity<T>(entityType: string): Promise<T | null> {
  await ensureAuth()
  return new Promise((resolve) => {
    bcw.brainCloudClient.entity.getSingleton(entityType, (result) => {
      if (result.status === 200 && result.data?.entityId) {
        resolve((result.data as { entityId: string; data: T }).data ?? null)
      } else {
        resolve(null)
      }
    })
  })
}

/**
 * Write (upsert) a singleton entity for the authenticated user.
 * Uses version -1 to skip optimistic-lock checks — last write wins.
 */
export async function writeEntity<T>(entityType: string, data: T): Promise<void> {
  await ensureAuth()
  return new Promise((resolve) => {
    bcw.brainCloudClient.entity.updateSingleton(
      entityType,
      data,
      { other: 'none' },  // ACL: private to this user
      -1,                  // version: -1 = always overwrite
      (result) => {
        if (result.status !== 200) {
          console.warn(`[BC] writeEntity "${entityType}" failed:`, result.reason_code, result.status_message)
        }
        resolve()
      }
    )
  })
}
