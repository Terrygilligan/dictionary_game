export type VillageEvent =
  | VillageCreated
  | VillageUpdated
  | ContributionAdded
  | ContributionVoted
  | VillageBattleCreated
  | VillageBattleStarted
  | VillageBattleCompleted
  | VillageStatsUpdated

export interface VillageCreated {
  type: 'village/created'
  villageId: string
  name: string
  description: string
  createdAt: number
}

export interface VillageUpdated {
  type: 'village/updated'
  villageId: string
  name?: string
  description?: string
  updatedAt: number
}

export interface ContributionAdded {
  type: 'contribution/added'
  villageId: string
  contributionId: string
  userId: string
  userName: string
  wordId: string
  definition: string
  translation?: string
  createdAt: number
}

export interface ContributionVoted {
  type: 'contribution/voted'
  villageId: string
  contributionId: string
  userId: string
  vote: 'up' | 'down'
  votedAt: number
}

export interface VillageBattleCreated {
  type: 'battle/created'
  battleId: string
  villageId: string
  name: string
  description: string
  startTime: number
  endTime: number
  createdAt: number
}

export interface VillageBattleStarted {
  type: 'battle/started'
  battleId: string
  startedAt: number
}

export interface VillageBattleCompleted {
  type: 'battle/completed'
  battleId: string
  winnerId?: string
  finalScores: readonly { userId: string; score: number }[]
  completedAt: number
}

export interface VillageStatsUpdated {
  type: 'stats/updated'
  villageId: string
  stats: {
    memberCount: number
    totalContributions: number
    activeContributors: number
  }
  updatedAt: number
}
