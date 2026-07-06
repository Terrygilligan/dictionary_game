import type { VillageState } from './state'
import type { VillageEvent } from './events'

/**
 * Pure village domain evolver.
 * 
 * Takes current state and an event, returns the next state.
 * This function must remain pure: no I/O, no side effects.
 * 
 * The single source of truth for village state transformation.
 */
export function evolveVillage(state: VillageState, event: VillageEvent): VillageState {
  switch (event.type) {
    case 'village/created':
      return {
        ...state,
        villages: [...state.villages, {
          id: event.villageId,
          name: event.name,
          description: event.description,
          createdAt: event.createdAt,
          memberCount: 0,
          totalContributions: 0,
          activeContributors: 0,
        }],
        currentVillage: state.currentVillage?.id === event.villageId ? state.currentVillage : null,
        lastUpdated: event.createdAt,
      }

    case 'village/updated':
      return {
        ...state,
        villages: state.villages.map(village =>
          village.id === event.villageId
            ? { ...village, ...event }
            : village
        ),
        currentVillage: state.currentVillage?.id === event.villageId
          ? { ...state.currentVillage, ...event }
          : state.currentVillage,
        lastUpdated: event.updatedAt,
      }

    case 'contribution/added':
      return {
        ...state,
        villages: state.villages.map(village =>
          village.id === event.villageId
            ? {
                ...village,
                totalContributions: village.totalContributions + 1,
                activeContributors: village.activeContributors + 1,
              }
            : village
        ),
        lastUpdated: event.createdAt,
      }

    case 'stats/updated':
      return {
        ...state,
        villages: state.villages.map(village =>
          village.id === event.villageId
            ? {
                ...village,
                memberCount: event.stats.memberCount,
                totalContributions: event.stats.totalContributions,
                activeContributors: event.stats.activeContributors,
              }
            : village
        ),
        lastUpdated: event.updatedAt,
      }

    case 'battle/created':
      return {
        ...state,
        battles: [...state.battles, {
          id: event.battleId,
          name: event.name,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          status: 'upcoming',
          participants: [],
          rules: [],
        }],
        lastUpdated: event.createdAt,
      }

    case 'battle/started':
      return {
        ...state,
        battles: state.battles.map(battle =>
          battle.id === event.battleId
            ? { ...battle, status: 'active' }
            : battle
        ),
        lastUpdated: event.startedAt,
      }

    case 'battle/completed':
      return {
        ...state,
        battles: state.battles.map(battle =>
          battle.id === event.battleId
            ? { ...battle, status: 'completed' }
            : battle
        ),
        lastUpdated: event.completedAt,
      }

    default:
      // Exhaustive checking - will cause TypeScript error if new events added
      return state
  }
}
