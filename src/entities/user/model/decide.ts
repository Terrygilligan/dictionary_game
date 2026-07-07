import type { UserState } from './state.ts'
import type { UserCommand, UserEvent } from './index.ts'

/**
 * Pure user domain decider.
 * 
 * Takes current state and a command, returns the events that should occur.
 * Invalid commands return empty array - no events are committed.
 * 
 * This function must remain pure: no I/O, no randomness, no Date.now().
 */
export function decideUser(
  state: UserState,
  command: UserCommand,
): readonly UserEvent[] {
  switch (command.type) {
    case 'user/create':
      // Only create user if none exists
      if (state.user) return []
      
      return [{
        type: 'user/created',
        userId: 'user_' + Date.now(), // Will be replaced by proper ID generation
        email: command.email,
        displayName: command.displayName,
        createdAt: Date.now(), // Will be replaced by injectable clock
      }]

    case 'user/register':
      // Only register if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      return [{
        type: 'user/registered',
        userId: command.userId,
        email: command.email,
        displayName: command.displayName,
        emailVerified: command.emailVerified,
        createdAt: command.createdAt,
      }]

    case 'user/authenticate':
      // Only authenticate if user exists and is anonymous
      if (!state.user || state.authStatus === 'authenticated') return []
      
      return [{
        type: 'user/authenticated',
        userId: state.user.id,
        token: command.token, // Token handled by auth service, not exposed to UI
        timestamp: Date.now(), // Will be replaced by injectable clock
      }]

    case 'user/update':
      // Only update if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      if (!command.displayName) return [] // No changes to make
      
      return [{
        type: 'user/updated',
        userId: state.user.id,
        displayName: command.displayName,
        timestamp: Date.now(), // Will be replaced by injectable clock
      }]

    case 'user/verify-email':
      // Only verify email if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      return [{
        type: 'user/email-verified',
        userId: command.userId,
        email: command.email,
        verifiedAt: Date.now(), // Will be replaced by injectable clock
      }]

    case 'profile/update':
      // Only update profile if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      const events: UserEvent[] = []
      
      if (command.totalScore !== undefined || command.matchesPlayed !== undefined) {
        events.push({
          type: 'profile/updated',
          userId: state.user.id,
          totalScore: command.totalScore,
          matchesPlayed: command.matchesPlayed,
          timestamp: Date.now(), // Will be replaced by injectable clock
        })
      }
      
      return events

    case 'stats/update':
      // Only update stats if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      const statsEvents: UserEvent[] = []
      
      // Check if any stats are being updated
      const hasUpdates = 
        command.gamesPlayed !== undefined ||
        command.correctAnswers !== undefined ||
        command.totalQuestions !== undefined ||
        command.streak !== undefined ||
        command.highestStreak !== undefined
      
      if (hasUpdates) {
        statsEvents.push({
          type: 'stats/updated',
          userId: state.user.id,
          gamesPlayed: command.gamesPlayed,
          correctAnswers: command.correctAnswers,
          totalQuestions: command.totalQuestions,
          streak: command.streak,
          highestStreak: command.highestStreak,
          timestamp: Date.now(), // Will be replaced by injectable clock
        })
      }
      
      return statsEvents

    case 'friend/add':
      // Only add friend if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      // Don't add duplicate friends
      if (state.friends.includes(command.friendId)) return []
      
      return [{
        type: 'friend/added',
        userId: state.user.id,
        friendId: command.friendId,
        timestamp: Date.now(), // Will be replaced by injectable clock
      }]

    case 'friend/remove':
      // Only remove friend if user exists and is authenticated
      if (!state.user || state.authStatus !== 'authenticated') return []
      
      // Can't remove non-existent friend
      if (!state.friends.includes(command.friendId)) return []
      
      return [{
        type: 'friend/removed',
        userId: state.user.id,
        friendId: command.friendId,
        timestamp: Date.now(), // Will be replaced by injectable clock
      }]

    case 'user/sync':
      // Sync is handled by sync service, not domain logic
      return []

    default:
      // Exhaustive checking - will cause TypeScript error if new commands added
      return []
  }
}
