import { useCallback } from 'react'
import { useUserStore, useUserIdentity } from './context.ts'
import type { UserCommand } from './commands.ts'

/**
 * Hook for dispatching user commands with identity parameters
 */
export function useUserDispatch() {
  const store = useUserStore()
  const { tenant_id, aggregate_id } = useUserIdentity()
  
  return useCallback((command: UserCommand) => {
    if (!tenant_id || !aggregate_id) {
      throw new Error('Cannot dispatch user command: identity not resolved (tenant_id or aggregate_id is null)')
    }
    store.dispatch(command, tenant_id, aggregate_id)
  }, [store, tenant_id, aggregate_id])
}

/**
 * Hook for getting the current user from the store
 */
export function useCurrentUser() {
  const store = useUserStore()
  const { tenant_id, aggregate_id } = useUserIdentity()
  
  if (!tenant_id || !aggregate_id) {
    return null
  }
  
  return store.getState(tenant_id, aggregate_id).user
}

/**
 * Hook for getting user authentication status
 */
export function useAuthStatus() {
  const store = useUserStore()
  const { tenant_id, aggregate_id } = useUserIdentity()
  
  if (!tenant_id || !aggregate_id) {
    return 'anonymous'
  }
  
  return store.getState(tenant_id, aggregate_id).authStatus
}
