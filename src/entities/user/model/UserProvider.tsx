import { useState, useEffect, type ReactNode } from 'react'
import { UserStoreContext } from './context.ts'
import { UserStatsContext } from './UserStatsContext.tsx'
import { createUserStore, type UserStore } from './userStore.ts'
import type { UserStats } from './types.ts'
import type { UserCommand } from './commands.ts'

export interface UserProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: UserStore
}

export function UserProvider({ children, store }: UserProviderProps) {
  // State hooks
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  
  const [userStore] = useState<UserStore>(() => store ?? createUserStore())

  // Simple reset function instead of global assignment
  const resetUserStore = () => {
    setCurrentUserId(null)
    setUserStats(null)
    setStatsLoading(false)
    setStatsError(null)
    // Reset the store to initial state
    const logoutCommand: UserCommand = {
      type: 'user/authenticate',
      tenant_id: 'default',
      aggregate_id: 'default',
      token: '' // Empty token for logout
    }
    userStore.dispatch(logoutCommand)
  }

  // Fetch user stats function
  const fetchUserStats = async (userId: string): Promise<void> => {
    if (!userId) return
    
    setStatsLoading(true)
    setStatsError(null)
    
    try {
      // This would typically call an API service
      // For now, we'll simulate with existing user data
      const currentState = userStore.getState('default', 'default')
      if (currentState.user?.id === userId && currentState.user.stats) {
        setUserStats(currentState.user.stats)
      } else {
        // Default stats if no user data found
        const defaultStats: UserStats = {
          gamesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          streak: 0,
          highestStreak: 0,
          updatedAt: Date.now()
        }
        setUserStats(defaultStats)
      }
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Failed to fetch user stats')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    console.log('👤 [USER_PROVIDER] UserProvider mounted')
    
    // Context Mapping: Initialize currentUserId from store state
    const initialState = userStore.getState('default', 'default')
    if (initialState.user?.id) {
      setCurrentUserId(initialState.user.id)
    }
    
    // Subscribe to store changes using the event bus
    const unsubscribe = userStore.bus.subscribeAll(() => {
      const state = userStore.getState('default', 'default')
      console.log('👤 [USER_PROVIDER] Store state updated:', state)
      
      // Update currentUserId when user changes
      if (state.user?.id !== currentUserId) {
        setCurrentUserId(state.user?.id || null)
        // Update userStats when user changes
        if (state.user?.stats) {
          setUserStats(state.user.stats)
        }
      }
    })

    return () => {
      console.log('👤 [USER_PROVIDER] UserProvider unmounting')
      unsubscribe()
    }
  }, [userStore, currentUserId])

  // Data Fetching: Trigger fetchUserStats when userId changes
  useEffect(() => {
    if (currentUserId) {
      fetchUserStats(currentUserId)
    } else {
      setUserStats(null)
    }
  }, [currentUserId])

  // Create stats context value for UserStatsContext bridge
  const statsValue = {
    userStats,
    statsLoading,
    statsError,
    refetchStats: () => {
      if (currentUserId) {
        fetchUserStats(currentUserId)
      }
    }
  }

  // Export Reset: Provide both UserStoreContext and UserStatsContext
  return (
    <UserStoreContext.Provider value={userStore}>
      <UserStatsContext.Provider value={statsValue}>
        {children}
      </UserStatsContext.Provider>
    </UserStoreContext.Provider>
  )
}
