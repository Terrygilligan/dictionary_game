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
  const winRate = state.matchesPlayed > 0 ? 0 : 0 // Will be calculated from game events
  const averageScore = state.matchesPlayed > 0 ? state.totalScore / state.matchesPlayed : 0
  
  return {
    lifetimeScore: state.totalScore,
    matchesPlayed: state.matchesPlayed,
    winRate,
    averageScore,
    highestStreak: 0, // Will be calculated from game events
    currentStreak: 0, // Will be calculated from game events
  }
}

export const selectDisplayName = (state: UserState): string => 
  state.user?.displayName ?? 'Anonymous User'

export const selectUserId = (state: UserState): string | null => 
  state.user?.id ?? null

export const selectLastSyncAt = (state: UserState): number | undefined => 
  state.lastSyncAt
