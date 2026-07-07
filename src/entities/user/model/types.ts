export type AuthStatus = 'anonymous' | 'authenticated' | 'loading'

export interface UserStats {
  readonly gamesPlayed: number
  readonly correctAnswers: number
  readonly totalQuestions: number
  readonly streak: number
  readonly highestStreak: number
  readonly updatedAt: number
}

export interface User {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
  readonly lastLoginAt?: number
  readonly stats: UserStats
  readonly village?: string
  readonly postcode?: string
  readonly shareLocationForLeaderboard?: boolean
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


export interface FriendActivity {
  readonly userId: string
  readonly displayName: string
  readonly matchId: string
  readonly score: number
  readonly completedAt: number
}
