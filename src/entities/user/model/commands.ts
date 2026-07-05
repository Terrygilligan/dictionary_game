export interface CreateUser {
  readonly type: 'user/create'
  readonly email: string
  readonly displayName: string
}

export interface AuthenticateUser {
  readonly type: 'user/authenticate'
  readonly token: string // Handled by auth service
}

export interface UpdateUser {
  readonly type: 'user/update'
  readonly displayName?: string
}

export interface UpdateProfile {
  readonly type: 'profile/update'
  readonly totalScore?: number
  readonly matchesPlayed?: number
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
  | AuthenticateUser
  | UpdateUser
  | UpdateProfile
  | AddFriend
  | RemoveFriend
  | SyncUser
