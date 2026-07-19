/**
 * Base interface for all user events with explicit multi-tenant isolation
 * Following Command Identity Directive - ALL events MUST inherit identity metadata
 */
export interface BaseUserEvent {
  /** Unique identifier for the tenant (inherited from command) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (inherited from command) */
  readonly aggregate_id: string
  /** Type discriminator for the specific event */
  readonly type: string
}

export interface UserCreated extends BaseUserEvent {
  readonly type: 'user/created'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly createdAt: number
}

export interface UserRegistered extends BaseUserEvent {
  readonly type: 'user/registered'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
}

export interface UserAuthenticated extends BaseUserEvent {
  readonly type: 'user/authenticated'
  readonly userId: string
  readonly token: string // Handled by auth service, not exposed to UI
  readonly timestamp: number
}

export interface UserUpdated extends BaseUserEvent {
  readonly type: 'user/updated'
  readonly userId: string
  readonly displayName?: string
  readonly timestamp: number
}

export interface UserEmailVerified extends BaseUserEvent {
  readonly type: 'user/email-verified'
  readonly userId: string
  readonly email: string
  readonly verifiedAt: number
}

export interface ProfileUpdated extends BaseUserEvent {
  readonly type: 'profile/updated'
  readonly userId: string
  readonly totalScore?: number
  readonly matchesPlayed?: number
  readonly village?: string
  readonly postcode?: string
  readonly shareLocationForLeaderboard?: boolean
  readonly timestamp: number
}

export interface AchievementUnlocked extends BaseUserEvent {
  readonly type: 'achievement/unlocked'
  readonly userId: string
  readonly achievementId: string
  readonly name: string
  readonly description: string
  readonly category: 'score' | 'streak' | 'games' | 'social'
  readonly unlockedAt: number
}

export interface FriendAdded extends BaseUserEvent {
  readonly type: 'friend/added'
  readonly userId: string
  readonly friendId: string
  readonly timestamp: number
}

export interface FriendRemoved extends BaseUserEvent {
  readonly type: 'friend/removed'
  readonly userId: string
  readonly friendId: string
  readonly timestamp: number
}

export interface StatsUpdated extends BaseUserEvent {
  readonly type: 'stats/updated'
  readonly userId: string
  readonly gamesPlayed?: number
  readonly correctAnswers?: number
  readonly totalQuestions?: number
  readonly streak?: number
  readonly highestStreak?: number
  readonly timestamp: number
}

export interface SyncCompleted extends BaseUserEvent {
  readonly type: 'sync/completed'
  readonly userId: string
  readonly eventsSynced: number
  readonly timestamp: number
}

export interface GuestAccessRequested extends BaseUserEvent {
  readonly type: 'guestAccess/requested'
  readonly userId: string
  readonly timestamp: number
}

export interface GuestAccessGranted extends BaseUserEvent {
  readonly type: 'guestAccess/granted'
  readonly userId: string
  readonly gamesRemaining: number
  readonly timestamp: number
}

export interface GuestAccessDenied extends BaseUserEvent {
  readonly type: 'guestAccess/denied'
  readonly userId: string
  readonly reason: 'limit-reached' | 'other'
  readonly gamesPlayed: number
  readonly maxGames: number
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
  | GuestAccessRequested
  | GuestAccessGranted
  | GuestAccessDenied
