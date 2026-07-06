import { useState, type ReactNode } from 'react'
import { UserStoreContext } from './context.ts'
import { createUserStore, type UserStore } from './userStore.ts'

export interface UserProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: UserStore
}

export function UserProvider({ children, store }: UserProviderProps) {
  const [userStore] = useState<UserStore>(() => store ?? createUserStore())
  return <UserStoreContext.Provider value={userStore}>{children}</UserStoreContext.Provider>
}
