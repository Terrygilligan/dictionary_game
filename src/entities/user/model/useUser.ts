import { useCallback, useContext, useSyncExternalStore } from 'react'
import type { UserCommand, UserState } from './index.ts'
import { UserStoreContext } from './context.ts'
import type { UserStore } from './userStore.ts'

function useUserStore(): UserStore {
  const store = useContext(UserStoreContext)
  if (!store) {
    throw new Error('useUser hooks must be used within a <UserProvider>')
  }
  return store
}

/** Subscribes to the derived user state via the store's event log. */
export function useUserState(): UserState {
  const store = useUserStore()
  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}

/** Returns a stable command dispatcher bound to the current store. */
export function useUserDispatch(): (command: UserCommand) => void {
  const store = useUserStore()
  return useCallback((command: UserCommand) => store.dispatch(command), [store])
}

/** Returns the current user if authenticated, null otherwise. */
export function useCurrentUser() {
  const state = useUserState()
  return state.user
}
