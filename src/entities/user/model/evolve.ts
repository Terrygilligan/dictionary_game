import type { UserState } from './state.ts'
import type { UserEvent } from './events.ts'

/**
 * Pure user domain evolver.
 * 
 * Takes current state and an event, returns the next state.
 * This function must remain pure: no I/O, no side effects.
 * 
 * The single source of truth for user state transformation.
 */
export function evolveUser(state: UserState, event: UserEvent): UserState {
  switch (event.type) {
    case 'user/created':
      return {
        ...state,
        user: {
          id: event.userId,
          email: event.email,
          displayName: event.displayName,
          emailVerified: false, // Default to false until verified
          createdAt: event.createdAt,
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: event.createdAt,
          },
        },
        authStatus: 'authenticated',
      }

    case 'user/registered':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          emailVerified: event.emailVerified,
        } : state.user,
      }

    case 'user/authenticated':
      return {
        ...state,
        authStatus: 'authenticated',
        user: state.user ? {
          ...state.user,
          lastLoginAt: event.timestamp,
        } : state.user,
      }

    case 'user/updated':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          displayName: event.displayName ?? state.user.displayName,
        } : state.user,
      }

    case 'user/email-verified':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          emailVerified: true,
        } : state.user,
      }

    case 'profile/updated':
      return {
        ...state,
        totalScore: event.totalScore ?? state.totalScore,
        matchesPlayed: event.matchesPlayed ?? state.matchesPlayed,
      }

    case 'stats/updated':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          stats: {
            gamesPlayed: event.gamesPlayed ?? state.user.stats.gamesPlayed,
            correctAnswers: event.correctAnswers ?? state.user.stats.correctAnswers,
            totalQuestions: event.totalQuestions ?? state.user.stats.totalQuestions,
            streak: event.streak ?? state.user.stats.streak,
            highestStreak: event.highestStreak ?? state.user.stats.highestStreak,
            updatedAt: event.timestamp,
          },
        } : state.user,
      }

    case 'achievement/unlocked':
      return {
        ...state,
        achievements: state.achievements.includes(event.achievementId)
          ? state.achievements
          : [...state.achievements, event.achievementId],
      }

    case 'friend/added':
      return {
        ...state,
        friends: state.friends.includes(event.friendId)
          ? state.friends
          : [...state.friends, event.friendId],
      }

    case 'friend/removed':
      return {
        ...state,
        friends: state.friends.filter(id => id !== event.friendId),
      }

    case 'sync/completed':
      return {
        ...state,
        lastSyncAt: event.timestamp,
      }

    case 'guestAccess/requested':
      return {
        ...state,
        guestAccess: {
          ...state.guestAccess,
          lastRequestAt: event.timestamp,
        },
      }

    case 'guestAccess/granted':
      return {
        ...state,
        guestAccess: {
          ...state.guestAccess,
          isAccessGranted: true,
        },
      }

    case 'guestAccess/denied':
      return {
        ...state,
        guestAccess: {
          ...state.guestAccess,
          isAccessGranted: false,
        },
      }

    default:
      // Exhaustive checking - will cause TypeScript error if new events added
      return state
  }
}
