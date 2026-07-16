import { createContext, useContext } from 'react'
import type { UserStore } from './userStore.ts'

export const UserStoreContext = createContext<UserStore | undefined>(undefined)

export function useUserStore(): UserStore {
  const store = useContext(UserStoreContext)
  if (!store) {
    throw new Error('useUserStore must be used within a UserProvider')
  }
  return store
}

/**
 * Context for user identity parameters (tenant_id, aggregate_id).
 * This is separate from the store context to allow identity to change
 * without recreating the entire store instance.
 */
export interface UserIdentityContextValue {
  tenant_id: string | null
  aggregate_id: string | null
}

export const UserIdentityContext = createContext<UserIdentityContextValue | undefined>(undefined)

export function useUserIdentity(): UserIdentityContextValue {
  const identity = useContext(UserIdentityContext)
  if (!identity) {
    throw new Error('useUserIdentity must be used within a UserProvider')
  }
  return identity
}
