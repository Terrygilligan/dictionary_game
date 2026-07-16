import { createContext, useContext } from 'react'
import type { VillageStore } from './villageStore'

export const VillageStoreContext = createContext<VillageStore | undefined>(undefined)

export function useVillageStore(): VillageStore {
  const store = useContext(VillageStoreContext)
  if (!store) {
    throw new Error('useVillageStore must be used within a VillageProvider')
  }
  return store
}

/**
 * Context for village identity parameters (tenant_id, aggregate_id).
 * This is separate from the store context to allow identity to change
 * without recreating the entire store instance.
 */
export interface VillageIdentityContextValue {
  tenant_id: string | null
  aggregate_id: string | null
}

export const VillageIdentityContext = createContext<VillageIdentityContextValue | undefined>(undefined)

export function useVillageIdentity(): VillageIdentityContextValue {
  const identity = useContext(VillageIdentityContext)
  if (!identity) {
    throw new Error('useVillageIdentity must be used within a VillageProvider')
  }
  return identity
}
