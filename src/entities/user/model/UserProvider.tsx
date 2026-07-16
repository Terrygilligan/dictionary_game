import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { UserStoreContext, UserIdentityContext } from './context.ts'
import { UserStatsContext } from './UserStatsContext.tsx'
import { UserClaimsProvider } from './UserClaimsContext.tsx'
import { userStore, type UserStore } from './userStore.ts'
import type { UserStats, UserClaims } from './types.ts'
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('USER_PROVIDER')

export interface UserProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: UserStore
}

export function UserProvider({ children, store }: UserProviderProps) {
  // Auth hook for identity resolution
  const { user, isLoading: authLoading } = useFirebaseAuth()
  
  // Auth initialization guard - prevents ghost sessions
  const [isInitializing, setIsInitializing] = useState(true)
  
  // Identity state derived from Firebase auth
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [aggregateId, setAggregateId] = useState<string | null>(null)
  
  // State hooks
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [userClaims, setUserClaims] = useState<UserClaims | null>(null)
  
  const [providedUserStore] = useState<UserStore>(() => store ?? userStore)

  
  // Fetch user stats function
  const fetchUserStats = useCallback(async (userId: string): Promise<void> => {
    if (!userId || !tenantId || !aggregateId) return
    
    setStatsLoading(true)
    setStatsError(null)
    
    try {
      // This would typically call an API service
      // For now, we'll simulate with existing user data
      const currentState = providedUserStore.getState(tenantId, aggregateId)
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
  }, [tenantId, aggregateId, providedUserStore])

  // Identity resolution: Map Firebase user to tenant/aggregate IDs
  useEffect(() => {
    logger.log('Auth state check:', { authLoading, userExists: !!user?.id })
    
    if (!authLoading) {
      logger.log('Firebase auth settled, determining user state')
      
      if (user?.id) {
        logger.log('Identity resolved:', { userId: user.id, claims: user.claims })
        logger.log('Full user object (sanitized):', { id: user.id, email: user.email, claims: user.claims })
        setTenantId(user.id)
        setAggregateId(user.id) // Map both to uid for per-user isolation
        setCurrentUserId(user.id)
        setUserClaims(user.claims || null)
        logger.log('setUserClaims called with:', user.claims)
      } else {
        logger.log('No authenticated user, clearing all identity state')
        setTenantId(null)
        setAggregateId(null)
        setCurrentUserId(null)
        setUserClaims(null)
        setUserStats(null) // Clear stats on sign-out
        logger.log('Identity state cleared')
      }
      
      // Auth initialization complete
      logger.log('Auth initialization complete, isInitializing = false')
      setIsInitializing(false)
    } else {
      logger.log('Firebase auth still loading, isInitializing = true')
    }
  }, [user, authLoading])

  useEffect(() => {
    logger.log('UserProvider mounted')
    
    // Only initialize store state if identity is resolved
    if (!tenantId || !aggregateId) {
      logger.log('Waiting for identity resolution')
      return
    }
    
    // Context Mapping: Initialize currentUserId from store state
    const initialState = providedUserStore.getState(tenantId, aggregateId)
    if (initialState.user?.id) {
      setCurrentUserId(initialState.user.id)
    }
    
    // Subscribe to store changes using the event bus
    const unsubscribe = providedUserStore.bus.subscribeAll(() => {
      const state = providedUserStore.getState(tenantId, aggregateId)
      logger.log('Store state updated:', state)
      
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
      logger.log('UserProvider unmounting')
      unsubscribe()
    }
  }, [providedUserStore, currentUserId, tenantId, aggregateId])

  // Data Fetching: Trigger fetchUserStats when userId changes
  useEffect(() => {
    if (currentUserId) {
      fetchUserStats(currentUserId)
    } else {
      setUserStats(null)
    }
  }, [currentUserId, fetchUserStats])

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

  // Identity context value
  const identityValue = {
    tenant_id: tenantId,
    aggregate_id: aggregateId,
  }

  // Export Reset: Provide both contexts
  return (
    <UserStoreContext.Provider value={providedUserStore}>
      <UserIdentityContext.Provider value={identityValue}>
        <UserClaimsProvider claims={userClaims} isLoading={isInitializing}>
          <UserStatsContext.Provider value={statsValue}>
            {isInitializing ? (
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Initializing authentication...</p>
                </div>
              </div>
            ) : (
              children
            )}
          </UserStatsContext.Provider>
        </UserClaimsProvider>
      </UserIdentityContext.Provider>
    </UserStoreContext.Provider>
  )
}
