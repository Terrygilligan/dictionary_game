/**
 * Vocabulary Entity Events
 * 
 * Domain events for vocabulary management following event-sourcing principles.
 * All events include tenant_id and aggregate_id for multi-tenant isolation.
 * 
 * Architectural Compliance:
 * - Event-Sourced: Immutable facts that drive state transitions
 * - Audit Trail: Every state change is recorded as an event
 * - Multi-Tenant: All events include identity metadata
 */

import type { VocabularyEntry, Definition } from './types'

/**
 * Base interface for all vocabulary events with explicit multi-tenant isolation
 */
export interface BaseVocabularyEvent {
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (user session, entity instance) */
  readonly aggregate_id: string
  /** Type discriminator for the specific event */
  readonly type: string
}

/**
 * Word definition added to vocabulary curriculum
 * 
 * Emitted when a new vocabulary entry is successfully validated and added.
 * Contains the complete entry data for audit trail.
 */
export interface WordDefinitionAdded extends BaseVocabularyEvent {
  readonly type: 'vocabulary/wordDefinitionAdded'
  readonly wordId: string
  readonly entry: VocabularyEntry
  readonly addedAt: number
}

/**
 * Multiple word definitions added in bulk
 * 
 * Emitted when bulk add operation succeeds.
 * Contains array of added word IDs for reference.
 */
export interface BulkWordDefinitionsAdded extends BaseVocabularyEvent {
  readonly type: 'vocabulary/bulkWordDefinitionsAdded'
  readonly wordIds: readonly string[]
  readonly count: number
  readonly addedAt: number
}

/**
 * Word definition updated
 * 
 * Emitted when an existing vocabulary entry is modified.
 * Contains the word ID and the fields that were updated.
 */
export interface WordDefinitionUpdated extends BaseVocabularyEvent {
  readonly type: 'vocabulary/wordDefinitionUpdated'
  readonly wordId: string
  readonly updates: {
    readonly definition?: Definition
    readonly sentence_frame?: string
    readonly semantic_group?: string
    readonly milestone_id?: number
  }
  readonly updatedAt: number
}

/**
 * Word definition removed
 * 
 * Emitted when a vocabulary entry is soft-deleted.
 * Contains the word ID and removal reason for audit trail.
 */
export interface WordDefinitionRemoved extends BaseVocabularyEvent {
  readonly type: 'vocabulary/wordDefinitionRemoved'
  readonly wordId: string
  readonly reason: string
  readonly removedAt: number
}

/**
 * Validation failed for word definition
 * 
 * Emitted when a vocabulary entry fails validation.
 * Contains validation errors for debugging.
 */
export interface WordDefinitionValidationFailed extends BaseVocabularyEvent {
  readonly type: 'vocabulary/wordDefinitionValidationFailed'
  readonly wordId: string
  readonly errors: readonly string[]
  readonly failedAt: number
}

/**
 * Union type of all vocabulary events
 */
export type VocabularyEvent =
  | WordDefinitionAdded
  | BulkWordDefinitionsAdded
  | WordDefinitionUpdated
  | WordDefinitionRemoved
  | WordDefinitionValidationFailed
