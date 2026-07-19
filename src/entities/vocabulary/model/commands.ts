/**
 * Vocabulary Entity Commands
 * 
 * Commands for vocabulary management following the Command Identity Directive.
 * All commands MUST include tenant_id and aggregate_id for multi-tenant isolation.
 * 
 * Architectural Compliance:
 * - Command Identity: Every command includes explicit tenant_id and aggregate_id
 * - Event-Sourced: Commands are validated by decider and produce events
 * - Multi-Tenant: All operations scoped by tenant_id
 */

import type { VocabularyEntry, Definition } from './types'

/**
 * Base interface for all vocabulary commands with explicit multi-tenant isolation
 * Following Command Identity Directive - ALL commands MUST extend this interface
 */
export interface BaseVocabularyCommand {
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (user session, entity instance) */
  readonly aggregate_id: string
  /** Type discriminator for the specific command */
  readonly type: string
}

/**
 * Add a word definition to the vocabulary curriculum
 * 
 * This command is used by the seeder to ingest vocabulary entries from the manifest.
 * The decider will validate the entry and emit a WordDefinitionAdded event.
 */
export interface AddWordDefinition extends BaseVocabularyCommand {
  readonly type: 'vocabulary/addWordDefinition'
  readonly entry: VocabularyEntry
}

/**
 * Bulk add multiple word definitions
 * 
 * Optimized command for adding multiple vocabulary entries in a single operation.
 * The decider will validate each entry and emit individual WordDefinitionAdded events.
 */
export interface BulkAddWordDefinitions extends BaseVocabularyCommand {
  readonly type: 'vocabulary/bulkAddWordDefinitions'
  readonly entries: readonly VocabularyEntry[]
}

/**
 * Update a word definition
 * 
 * Used to modify existing vocabulary entries.
 * Maintains audit trail through event sourcing.
 */
export interface UpdateWordDefinition extends BaseVocabularyCommand {
  readonly type: 'vocabulary/updateWordDefinition'
  readonly wordId: string
  readonly updates: Partial<{
    readonly definition: Definition
    readonly sentence_frame: string
    readonly semantic_group: string
    readonly milestone_id: number
  }>
}

/**
 * Remove a word definition
 * 
 * Soft delete through event sourcing - emits WordDefinitionRemoved event.
 * Actual removal handled by projection.
 */
export interface RemoveWordDefinition extends BaseVocabularyCommand {
  readonly type: 'vocabulary/removeWordDefinition'
  readonly wordId: string
  readonly reason: string
}

/**
 * Union type of all vocabulary commands
 */
export type VocabularyCommand =
  | AddWordDefinition
  | BulkAddWordDefinitions
  | UpdateWordDefinition
  | RemoveWordDefinition
