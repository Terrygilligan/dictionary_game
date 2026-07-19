import type { User, AuthStatus } from './types.ts'

export interface GuestAccessState {
  readonly gamesPlayed: number
  readonly maxGames: number
  readonly lastRequestAt?: number
  readonly isAccessGranted: boolean
}

export interface UserState {
  readonly user: User | null
  readonly authStatus: AuthStatus
  readonly totalScore: number
  readonly matchesPlayed: number
  readonly achievements: readonly string[] // Achievement IDs
  readonly friends: readonly string[] // User IDs
  readonly lastSyncAt?: number
  readonly guestAccess: GuestAccessState
}

export const initialUserState: UserState = {
  user: null,
  authStatus: 'anonymous',
  totalScore: 0,
  matchesPlayed: 0,
  achievements: [],
  friends: [],
  guestAccess: {
    gamesPlayed: 0,
    maxGames: 3, // Default max games for guest access
    isAccessGranted: false,
  },
}
