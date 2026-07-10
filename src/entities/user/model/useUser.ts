import { useCallback } from 'react'
import { useUserStore } from './context.ts'
import type { UserCommand } from './commands.ts'

/**
 * Hook for dispatching user commands
 */
export function useUserDispatch() {
  const store = useUserStore()
  
  return useCallback((command: UserCommand) => {
    store.dispatch(command)
  }, [store])
}

/**
 * Hook for getting the current user from the store
 */
export function useCurrentUser() {
  const store = useUserStore()
  return store.getState('default', 'default').user
}

/**
 * Hook for getting user authentication status
 */
export function useAuthStatus() {
  const store = useUserStore()
  return store.getState('default', 'default').authStatus
}
