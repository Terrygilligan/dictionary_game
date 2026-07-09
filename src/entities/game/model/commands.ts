import type { RoundSpec } from './types.ts'

/**
 * Base interface for all game commands with explicit multi-tenant isolation
 * Following Event-Driven Architecture Blueprint compliance
 */
export interface BaseGameCommand {
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (game session, entity instance) */
  readonly aggregate_id: string
  /** Type discriminator for the specific command */
  readonly type: string
}

/**
 * Intents emitted by the UI. Commands are requests — they may be rejected by
 * the decider (producing no events) when they are not valid for the current
 * state.
 * 
 * All commands now explicitly include tenant_id and aggregate_id for multi-tenant isolation.
 */
export type GameCommand =
  | BaseGameCommand & { readonly type: 'startGame'; readonly deck: readonly RoundSpec[] }
  | BaseGameCommand & { readonly type: 'submitAnswer'; readonly choiceId: string }
  | BaseGameCommand & { readonly type: 'nextRound' }
  | BaseGameCommand & { readonly type: 'resetStreak' }
  | BaseGameCommand & { readonly type: 'setLanguage'; readonly language: string }
  | BaseGameCommand & { readonly type: 'resetGame'; readonly reason: 'session-expired' | 'manual-reset' | 'navigation-change' }
