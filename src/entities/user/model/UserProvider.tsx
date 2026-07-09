import { useState, useEffect, type ReactNode } from 'react'
import { UserStoreContext } from './context.ts'
import { UserStatsContext } from './UserStatsContext.tsx'
import { createUserStore, type UserStore } from './userStore.ts'
import { useNavigation } from '@/shared/lib/navigation'
import { userService } from '@/services/userService'
import type { UserStats } from '@/entities/user'

export interface UserProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: UserStore
}

export function UserProvider({ children, store }: UserProviderProps) {
  const [userStore] = useState<UserStore>(() => store ?? createUserStore())
  const [isInitialized, setIsInitialized] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const { currentPage } = useNavigation()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Prevent duplicate initialization and ensure stable page transitions
  useEffect(() => {
    if (isInitialized) return
    
    // Only initialize when page is stable (not during rapid transitions)
    const initTimer = setTimeout(() => {
      console.log('🚀 [USER_PROVIDER] Initializing user store - page stable:', currentPage)
      setIsInitialized(true)
    }, 100) // 100ms delay to ensure page stability

    return () => clearTimeout(initTimer)
  }, [currentPage, isInitialized])

  // Centralized data fetching - monitor user state changes
  useEffect(() => {
    if (!isInitialized) return
    
    const unsubscribe = userStore.subscribe(() => {
      const state = userStore.getState()
      const userId = state.user?.id
      
      // Fetch user stats when user changes
      if (userId && userId !== currentUserId) {
        console.log('📊 [USER_PROVIDER] User changed, fetching stats for:', userId)
        setCurrentUserId(userId)
        fetchUserStats(userId)
      } else if (!userId && currentUserId) {
        // User logged out, clear stats
        console.log('📊 [USER_PROVIDER] User logged out, clearing stats')
        setCurrentUserId(null)
        setUserStats(null)
        setStatsError(null)
      }
    })

    return unsubscribe
  }, [userStore, isInitialized, currentUserId, currentPage])

  // Centralized user stats fetching
  const fetchUserStats = async (userId: string) => {
    if (statsLoading) return // Prevent duplicate fetches
    
    try {
      setStatsLoading(true)
      setStatsError(null)
      
      const stats = await userService.loadUserStats(userId, currentPage)
      if (stats) {
        setUserStats(stats)
        console.log('✅ [USER_PROVIDER] User stats loaded for:', userId)
      }
    } catch (error) {
      console.error('❌ [USER_PROVIDER] Failed to load user stats:', error)
      setStatsError('Failed to load user statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  // Expose reset method globally for router to call when needed
  useEffect(() => {
    if (!isInitialized) return
    
    // Make reset method available globally for logout/login scenarios
    (window as any).__resetUserStore = () => {
      console.log('🔄 [USER_PROVIDER] Global store reset requested - page:', currentPage)
      userStore.resetState()
      setUserStats(null)
      setCurrentUserId(null)
    }
    
    return () => {
      // Cleanup global reference
      delete (window as any).__resetUserStore
    }
  }, [userStore, isInitialized, currentPage])

  return (
    <UserStoreContext.Provider value={userStore}>
      <UserStatsContext.Provider value={{
        userStats,
        statsLoading,
        statsError,
        refetchStats: () => currentUserId && fetchUserStats(currentUserId)
      }}>
        {children}
      </UserStatsContext.Provider>
    </UserStoreContext.Provider>
  )
}
