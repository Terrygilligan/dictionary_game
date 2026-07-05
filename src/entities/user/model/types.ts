export type AuthStatus = 'anonymous' | 'authenticated' | 'loading'

export interface User {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
  readonly lastLoginAt?: number
}

export interface UserProfile {
  readonly user: User
  readonly authStatus: AuthStatus
  readonly totalScore: number
  readonly matchesPlayed: number
  readonly achievements: readonly Achievement[]
  readonly friends: readonly string[] // User IDs
  readonly lastSyncAt?: number
}

export interface Achievement {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly unlockedAt: number
  readonly category: 'score' | 'streak' | 'games' | 'social'
}

export interface UserStats {
  readonly lifetimeScore: number
  readonly matchesPlayed: number
  readonly winRate: number
  readonly averageScore: number
  readonly highestStreak: number
  readonly currentStreak: number
}

export interface FriendActivity {
  readonly userId: string
  readonly displayName: string
  readonly matchId: string
  readonly score: number
  readonly completedAt: number
}
