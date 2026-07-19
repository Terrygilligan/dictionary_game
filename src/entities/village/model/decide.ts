import type { VillageEvent } from './events'

/**
 * Context object for decider execution
 * 
 * Contains external dependencies that the decider needs but should not
 * generate itself, maintaining pure function architecture.
 */
export interface DeciderContext {
  readonly timestamp: number
}

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
  villageId?: string // Optional: if not provided, generated from context timestamp
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
  contributionId?: string // Optional: if not provided, generated from context timestamp
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
  battleId?: string // Optional: if not provided, generated from context timestamp
}

export type VillageCommand = CreateVillageCommand | AddContributionCommand | VoteContributionCommand | CreateBattleCommand

export function decideVillage(_state: any, command: VillageCommand, context: DeciderContext): VillageEvent[] {
  switch (command.type) {
    case 'village/create':
      if (!command.name.trim()) {
        return [] // Validation failed
      }
      
      return [{
        type: 'village/created',
        villageId: command.villageId || `village_${context.timestamp}`,
        name: command.name.trim(),
        description: command.description.trim(),
        createdAt: context.timestamp,
      }]

    case 'contribution/add':
      if (!command.definition.trim()) {
        return [] // Validation failed
      }

      return [{
        type: 'contribution/added',
        villageId: command.villageId,
        contributionId: command.contributionId || `contrib_${context.timestamp}`,
        userId: command.userId,
        userName: command.userName,
        wordId: command.wordId,
        definition: command.definition.trim(),
        translation: command.translation?.trim(),
        createdAt: context.timestamp,
      }]

    case 'contribution/vote':
      return [{
        type: 'contribution/voted',
        villageId: command.villageId,
        contributionId: command.contributionId,
        userId: command.userId,
        vote: command.vote,
        votedAt: context.timestamp,
      }]

    case 'battle/create':
      if (!command.name.trim() || command.endTime <= context.timestamp) {
        return [] // Validation failed
      }

      return [{
        type: 'battle/created',
        battleId: command.battleId || `battle_${context.timestamp}`,
        villageId: command.villageId,
        name: command.name.trim(),
        description: command.description.trim(),
        startTime: command.startTime,
        endTime: command.endTime,
        createdAt: context.timestamp,
      }]

    default:
      return [] // Unknown command
  }
}
