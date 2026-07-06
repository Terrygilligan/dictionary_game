import type { UserState } from './state.ts'
import type { UserProfile, UserStats, AuthStatus } from './types.ts'

/**
 * Pure selectors for user domain.
 * 
 * These functions extract derived state from the user state.
 * They enable the UI to query specific aspects without knowing the internal structure.
 */

export const selectUser = (state: UserState) => state.user

export const selectAuthStatus = (state: UserState): AuthStatus => state.authStatus

export const selectIsAuthenticated = (state: UserState): boolean => 
  state.authStatus === 'authenticated'

export const selectIsAnonymous = (state: UserState): boolean => 
  state.authStatus === 'anonymous'

export const selectTotalScore = (state: UserState): number => state.totalScore

export const selectMatchesPlayed = (state: UserState): number => state.matchesPlayed

export const selectFriends = (state: UserState): readonly string[] => state.friends

export const selectAchievements = (state: UserState): readonly string[] => state.achievements

export const selectUserProfile = (state: UserState): UserProfile | null => {
  if (!state.user) return null
  
  return {
    user: state.user,
    authStatus: state.authStatus,
    totalScore: state.totalScore,
    matchesPlayed: state.matchesPlayed,
    achievements: [], // Will be populated when achievement system is implemented
    friends: state.friends,
    lastSyncAt: state.lastSyncAt,
  }
}

export const selectUserStats = (state: UserState): UserStats => {
  // Return stats from the user object, or defaults if user doesn't exist
  if (!state.user) {
    return {
      gamesPlayed: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      streak: 0,
      highestStreak: 0,
      updatedAt: Date.now(),
    }
  }
  
  return state.user.stats
}

export const selectDisplayName = (state: UserState): string => 
  state.user?.displayName ?? 'Anonymous User'

export const selectUserId = (state: UserState): string | null => 
  state.user?.id ?? null

export const selectLastSyncAt = (state: UserState): number | undefined => 
  state.lastSyncAt
