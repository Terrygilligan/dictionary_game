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
