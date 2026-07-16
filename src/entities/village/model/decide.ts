import type { VillageEvent } from './events'

/**
 * Pure village decision function.
 * 
 * Takes current state and a command, returns events to be processed.
 * This function must remain pure: no I/O, no side effects.
 * 
 * Commands represent user intentions that need to be validated
 * before being converted to events.
 * 
 * ARCHITECTURAL ENFORCEMENT: All commands MUST include tenant_id and aggregate_id
 * for multi-tenant isolation and audit trail continuity.
 */

export interface CreateVillageCommand {
  type: 'village/create'
  tenant_id: string
  aggregate_id: string
  name: string
  description: string
  userId: string
}

export interface AddContributionCommand {
  type: 'contribution/add'
  tenant_id: string
  aggregate_id: string
  villageId: string
  userId: string
  userName: string
  wordId: string
  definition: string
  translation?: string
}

export interface VoteContributionCommand {
  type: 'contribution/vote'
  tenant_id: string
  aggregate_id: string
  villageId: string
  contributionId: string
  userId: string
  vote: 'up' | 'down'
}

export interface CreateBattleCommand {
  type: 'battle/create'
  tenant_id: string
  aggregate_id: string
  villageId: string
  name: string
  description: string
  startTime: number
  endTime: number
  userId: string
}

export type VillageCommand = CreateVillageCommand | AddContributionCommand | VoteContributionCommand | CreateBattleCommand

export function decideVillage(_state: any, command: VillageCommand): VillageEvent[] {
  switch (command.type) {
    case 'village/create':
      if (!command.name.trim()) {
        return [] // Validation failed
      }
      
      return [{
        type: 'village/created',
        villageId: `village_${Date.now()}`,
        name: command.name.trim(),
        description: command.description.trim(),
        createdAt: Date.now(),
      }]

    case 'contribution/add':
      if (!command.definition.trim()) {
        return [] // Validation failed
      }

      return [{
        type: 'contribution/added',
        villageId: command.villageId,
        contributionId: `contrib_${Date.now()}`,
        userId: command.userId,
        userName: command.userName,
        wordId: command.wordId,
        definition: command.definition.trim(),
        translation: command.translation?.trim(),
        createdAt: Date.now(),
      }]

    case 'contribution/vote':
      return [{
        type: 'contribution/voted',
        villageId: command.villageId,
        contributionId: command.contributionId,
        userId: command.userId,
        vote: command.vote,
        votedAt: Date.now(),
      }]

    case 'battle/create':
      if (!command.name.trim() || command.endTime <= Date.now()) {
        return [] // Validation failed
      }

      return [{
        type: 'battle/created',
        battleId: `battle_${Date.now()}`,
        villageId: command.villageId,
        name: command.name.trim(),
        description: command.description.trim(),
        startTime: command.startTime,
        endTime: command.endTime,
        createdAt: Date.now(),
      }]

    default:
      return [] // Unknown command
  }
}
