// Ambient types for the untyped braincloud CommonJS package
declare module 'braincloud' {
  interface BCResult {
    status: number
    reason_code?: number
    status_message?: string
    data?: Record<string, unknown>
  }

  type BCCallback = (result: BCResult) => void

  interface BCEntity {
    getSingleton(entityType: string, callback: BCCallback): void
    updateSingleton(entityType: string, data: unknown, acl: unknown, version: number, callback: BCCallback): void
  }

  interface BCClient {
    entity: BCEntity
  }

  class BrainCloudWrapper {
    brainCloudClient: BCClient
    constructor(wrapperName: string)
    initialize(appId: string, secret: string, appVersion: string): void
    authenticateAnonymous(responseHandler: BCCallback): void
  }
}

// Vite env variables
interface ImportMetaEnv {
  readonly VITE_BC_APP_ID: string
  readonly VITE_BC_SECRET: string
  readonly VITE_BC_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
