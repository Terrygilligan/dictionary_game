import { createContext, useContext } from 'react'
import type { UserStats } from '@/entities/user'

export interface UserStatsContextType {
  userStats: UserStats | null
  statsLoading: boolean
  statsError: string | null
  refetchStats: () => void
}

export const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined)

export function useUserStats(): UserStatsContextType {
  const context = useContext(UserStatsContext)
  if (!context) {
    throw new Error('useUserStats must be used within a UserProvider')
  }
  return context
}
