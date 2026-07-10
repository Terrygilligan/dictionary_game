/**
 * Base interface for all user commands with explicit multi-tenant isolation
 * Following Command Identity Directive - ALL commands MUST extend this interface
 */
export interface BaseUserCommand {
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (user session, entity instance) */
  readonly aggregate_id: string
  /** Type discriminator for the specific command */
  readonly type: string
}

export interface CreateUser extends BaseUserCommand {
  readonly type: 'user/create'
  readonly email: string
  readonly displayName: string
}

export interface RegisterUser extends BaseUserCommand {
  readonly type: 'user/register'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
}

export interface AuthenticateUser extends BaseUserCommand {
  readonly type: 'user/authenticate'
  readonly token: string // Handled by auth service
}

export interface UpdateUser extends BaseUserCommand {
  readonly type: 'user/update'
  readonly displayName?: string
}

export interface VerifyUserEmail extends BaseUserCommand {
  readonly type: 'user/verify-email'
  readonly userId: string
  readonly email: string
}

export interface UpdateProfile extends BaseUserCommand {
  readonly type: 'profile/update'
  readonly totalScore?: number
  readonly matchesPlayed?: number
  readonly village?: string
  readonly postcode?: string
  readonly shareLocationForLeaderboard?: boolean
}

export interface UpdateStats extends BaseUserCommand {
  readonly type: 'stats/update'
  readonly gamesPlayed?: number
  readonly correctAnswers?: number
  readonly totalQuestions?: number
  readonly streak?: number
  readonly highestStreak?: number
}

export interface AddFriend extends BaseUserCommand {
  readonly type: 'friend/add'
  readonly friendId: string
}

export interface RemoveFriend extends BaseUserCommand {
  readonly type: 'friend/remove'
  readonly friendId: string
}

export interface SyncUser extends BaseUserCommand {
  readonly type: 'user/sync'
  readonly remoteEvents: unknown[] // To be typed when sync is implemented
}

export type UserCommand = 
  | CreateUser
  | RegisterUser
  | AuthenticateUser
  | UpdateUser
  | VerifyUserEmail
  | UpdateProfile
  | UpdateStats
  | AddFriend
  | RemoveFriend
  | SyncUser
