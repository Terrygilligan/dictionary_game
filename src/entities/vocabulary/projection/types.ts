/**
 * Vocabulary Projection Types
 * 
 * Type definitions for vocabulary projection system.
 * Separated from VocabularyProjectionService to maintain clean architecture.
 */

import type { VocabularyEntry } from '../model/types.js'

/**
 * Outbox Document Schema (matching OutboxProcessor structure)
 */
export interface OutboxDocument {
  readonly id: string
  readonly topic: string
  readonly payload: unknown
  readonly correlationId: string
  readonly status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  readonly createdAt: number
  readonly attempts: number
  readonly lastAttemptAt?: number
  readonly error?: string
  readonly processedAt?: number
  readonly nextRetryAt?: number
}

/**
 * Projection Error Document Schema
 */
export interface ProjectionError {
  readonly id: string
  readonly eventId: string
  readonly topic: string
  readonly error: string
  readonly payload: unknown
  readonly timestamp: number
  readonly tenant_id?: string
  readonly aggregate_id?: string
}

/**
 * Vocabulary Definition Document Schema (Read Model)
 */
export interface VocabularyDefinitionDocument {
  readonly wordId: string
  readonly entry: VocabularyEntry
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly projectedAt?: number
}

/**
 * Vocabulary Projection Configuration
 */
export interface VocabularyProjectionConfig {
  readonly enabled: boolean
  readonly batchSize: number
  readonly maxRetries: number
  readonly retryDelayMs: number
  readonly pollingIntervalMs: number
}
