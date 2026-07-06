export interface Village {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly createdAt: number
  readonly memberCount: number
  readonly totalContributions: number
  readonly activeContributors: number
  readonly currentWord?: VillageWord
}

export interface VillageWord {
  readonly id: string
  readonly word: string
  readonly language: string
  readonly createdAt: number
  readonly contributions: VillageContribution[]
  readonly deadline?: number
}

export interface VillageContribution {
  readonly id: string
  readonly userId: string
  readonly userName: string
  readonly definition: string
  readonly translation?: string
  readonly createdAt: number
  readonly votes: number
  readonly isApproved: boolean
}

export interface VillageBattle {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly startTime: number
  readonly endTime: number
  readonly status: 'upcoming' | 'active' | 'completed'
  readonly participants: string[] // User IDs
  readonly rules: VillageBattleRule[]
}

export interface VillageBattleRule {
  readonly id: string
  readonly type: 'word-definition' | 'translation' | 'speed-round'
  readonly description: string
  readonly points: number
  readonly timeLimit?: number
}

export interface VillageStats {
  readonly totalVillagers: number
  readonly activeToday: number
  readonly contributionsThisWeek: number
  readonly battlesCompleted: number
  readonly topContributors: VillageContributor[]
}

export interface VillageContributor {
  readonly userId: string
  readonly userName: string
  readonly contributions: number
  readonly votes: number
  readonly rank: number
}
