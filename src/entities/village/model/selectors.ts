import type { VillageState } from './state'
import type { Village, VillageBattle, VillageContribution, VillageContributor } from './types'

/**
 * Pure village selectors.
 * 
 * Functions to derive computed values from village state.
 * These functions must remain pure: no I/O, no side effects.
 */

export function getCurrentVillage(state: VillageState): Village | null {
  return state.currentVillage
}

export function getAllVillages(state: VillageState): readonly Village[] {
  return state.villages
}

export function getVillageById(state: VillageState, villageId: string): Village | null {
  return state.villages.find(village => village.id === villageId) ?? null
}

export function getVillageStats(state: VillageState): VillageState['stats'] {
  return state.stats
}

export function getActiveBattles(state: VillageState): readonly VillageBattle[] {
  return state.battles.filter(battle => battle.status === 'active')
}

export function getUpcomingBattles(state: VillageState): readonly VillageBattle[] {
  return state.battles.filter(battle => battle.status === 'upcoming')
}

export function getCompletedBattles(state: VillageState): readonly VillageBattle[] {
  return state.battles.filter(battle => battle.status === 'completed')
}

export function getBattleById(state: VillageState, battleId: string): VillageBattle | null {
  return state.battles.find(battle => battle.id === battleId) ?? null
}

export function getVillageContributions(state: VillageState, villageId: string): readonly VillageContribution[] {
  const village = getVillageById(state, villageId)
  return village?.currentWord?.contributions ?? []
}

export function getTopContributors(state: VillageState): readonly VillageContributor[] {
  return state.stats?.topContributors ?? []
}

export function isLoading(state: VillageState): boolean {
  return state.isLoading
}

export function getError(state: VillageState): string | null {
  return state.error
}

export function getLastUpdated(state: VillageState): number | null {
  return state.lastUpdated
}
