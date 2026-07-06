import type { Village, VillageStats, VillageBattle } from './types'

export interface VillageState {
  readonly currentVillage: Village | null
  readonly villages: readonly Village[]
  readonly stats: VillageStats | null
  readonly battles: readonly VillageBattle[]
  readonly isLoading: boolean
  readonly error: string | null
  readonly lastUpdated: number | null
}
