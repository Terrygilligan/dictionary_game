export interface CreateUser {
  readonly type: 'user/create'
  readonly email: string
  readonly displayName: string
}

export interface RegisterUser {
  readonly type: 'user/register'
  readonly userId: string
  readonly email: string
  readonly displayName: string
  readonly emailVerified: boolean
  readonly createdAt: number
}

export interface AuthenticateUser {
  readonly type: 'user/authenticate'
  readonly token: string // Handled by auth service
}

export interface UpdateUser {
  readonly type: 'user/update'
  readonly displayName?: string
}

export interface VerifyUserEmail {
  readonly type: 'user/verify-email'
  readonly userId: string
  readonly email: string
}

export interface UpdateProfile {
  readonly type: 'profile/update'
  readonly totalScore?: number
  readonly matchesPlayed?: number
  readonly village?: string
  readonly postcode?: string
  readonly shareLocationForLeaderboard?: boolean
}

export interface UpdateStats {
  readonly type: 'stats/update'
  readonly gamesPlayed?: number
  readonly correctAnswers?: number
  readonly totalQuestions?: number
  readonly streak?: number
  readonly highestStreak?: number
}

export interface AddFriend {
  readonly type: 'friend/add'
  readonly friendId: string
}

export interface RemoveFriend {
  readonly type: 'friend/remove'
  readonly friendId: string
}

export interface SyncUser {
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
