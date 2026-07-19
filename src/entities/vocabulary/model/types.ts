/**
 * Vocabulary Entity - Domain Model
 * 
 * Type-safe domain model for vocabulary entries supporting bidirectional
 * learning and milestone-based progression in the Immersion Engine.
 * 
 * Architectural Compliance:
 * - FSD: Entity layer domain model
 * - Type-Safe: Strict TypeScript interfaces
 * - Event-Sourced Ready: Prepared for command/event integration
 * - Multi-Tenant Aware: Language-scoped entries
 */

/**
 * Word type classification for learning strategy
 * - CONCRETE: Standalone words with clear definitions (e.g., "apple", "run")
 * - CONTEXTUAL: Words requiring sentence context for proper understanding (e.g., "ambiguous", " nuanced")
 */
export type WordType = 'CONCRETE' | 'CONTEXTUAL'

/**
 * Definition structure with multiple levels of detail
 * - short: Quick definition for flashcard-style learning
 * - long: Comprehensive definition with nuance and usage notes
 */
export interface Definition {
  readonly short: string
  readonly long: string
}

/**
 * Vocabulary Entry - Core Domain Model
 * 
 * Represents a single vocabulary item in the curriculum with full
 * metadata for bidirectional learning and milestone progression.
 */
export interface VocabularyEntry {
  /** Unique identifier (UUID format) */
  readonly id: string
  
  /** Language code (e.g., 'en', 'bg', 'nl') */
  readonly language: string
  
  /** The word itself */
  readonly word: string
  
  /** Word type classification */
  readonly word_type: WordType
  
  /** Definition structure with short and long forms */
  readonly definition: Definition
  
  /** Sentence context frame (required for CONTEXTUAL words) */
  readonly sentence_frame?: string
  
  /** Semantic grouping for related concepts */
  readonly semantic_group: string
  
  /** Milestone identifier (1 = Foundational, 2 = Simple Sentences, etc.) */
  readonly milestone_id: number
}

/**
 * Vocabulary Manifest - Collection of vocabulary entries
 * 
 * The structured curriculum format for the Immersion Engine.
 * Maintains type safety and validation constraints.
 */
export interface VocabularyManifest {
  readonly version: string
  readonly entries: readonly VocabularyEntry[]
  readonly generated_at: number
}

/**
 * Validation result for vocabulary entries
 */
export interface ValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
}
