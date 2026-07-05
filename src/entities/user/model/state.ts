import type { User, AuthStatus } from './types.ts'

export interface UserState {
  readonly user: User | null
  readonly authStatus: AuthStatus
  readonly totalScore: number
  readonly matchesPlayed: number
  readonly achievements: readonly string[] // Achievement IDs
  readonly friends: readonly string[] // User IDs
  readonly lastSyncAt?: number
}

export const initialUserState: UserState = {
  user: null,
  authStatus: 'anonymous',
  totalScore: 0,
  matchesPlayed: 0,
  achievements: [],
  friends: [],
}
