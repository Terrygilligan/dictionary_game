import { useState, useEffect, type ReactNode } from 'react'
import { UserStoreContext } from './context.ts'
import { createUserStore, type UserStore } from './userStore.ts'

export interface UserProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: UserStore
}

export function UserProvider({ children, store }: UserProviderProps) {
  const [userStore] = useState<UserStore>(() => store ?? createUserStore())

  // Expose reset method globally for router to call when needed
  useEffect(() => {
    // Make reset method available globally for logout/login scenarios
    (window as any).__resetUserStore = () => {
      console.log('🔄 [USER_PROVIDER] Global store reset requested')
      userStore.resetState()
    }
    
    return () => {
      // Cleanup global reference
      delete (window as any).__resetUserStore
    }
  }, [userStore])

  return <UserStoreContext.Provider value={userStore}>{children}</UserStoreContext.Provider>
}
