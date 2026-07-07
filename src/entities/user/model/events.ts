export interface UserCreated {
  readonly type: 'user/created'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: number
}

export interface UserRegistered {
  readonly type: 'user/registered'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
}

export interface UserAuthenticated {
  readonly type: 'user/authenticated'
  readonly userId: string
  readonly token: string // Handled by auth service, not exposed to UI
  readonly timestamp: number
}

export interface UserUpdated {
  readonly type: 'user/updated'
  readonly userId: string
  readonly displayName?: string
  readonly timestamp: number
}

export interface UserEmailVerified {
  readonly type: 'user/email-verified'
  readonly userId: string
  readonly email: string
  readonly verifiedAt: number
}

export interface ProfileUpdated {
  readonly type: 'profile/updated'
  readonly userId: string
  readonly totalScore?: number
  readonly matchesPlayed?: number
  readonly village?: string
  readonly postcode?: string
  readonly shareLocationForLeaderboard?: boolean
  readonly timestamp: number
}

export interface AchievementUnlocked {
  readonly type: 'achievement/unlocked'
  readonly userId: string
  readonly achievementId: string
  readonly name: string
  readonly description: string
  readonly category: 'score' | 'streak' | 'games' | 'social'
  readonly unlockedAt: number
}

export interface FriendAdded {
  readonly type: 'friend/added'
  readonly userId: string
  readonly friendId: string
  readonly timestamp: number
}

export interface FriendRemoved {
  readonly type: 'friend/removed'
  readonly userId: string
  readonly friendId: string
  readonly timestamp: number
}

export interface StatsUpdated {
  readonly type: 'stats/updated'
  readonly userId: string
  readonly gamesPlayed?: number
  readonly correctAnswers?: number
  readonly totalQuestions?: number
  readonly streak?: number
  readonly highestStreak?: number
  readonly timestamp: number
}

export interface SyncCompleted {
  readonly type: 'sync/completed'
  readonly userId: string
  readonly eventsSynced: number
  readonly timestamp: number
}

export type UserEvent = 
  | UserCreated
  | UserRegistered
  | UserAuthenticated
  | UserUpdated
  | UserEmailVerified
  | ProfileUpdated
  | StatsUpdated
  | AchievementUnlocked
  | FriendAdded
  | FriendRemoved
  | SyncCompleted
