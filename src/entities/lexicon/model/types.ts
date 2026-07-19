export interface WordCoordinate {
  scroll: string
  page: number
  column: number
  wordNumber: number
}

/**
 * Polysemy rating for semantic ambiguity handling
 * 1 = Single meaning, 5 = Highly polysemous (multiple distinct meanings)
 */
export type PolysemyRating = 1 | 2 | 3 | 4 | 5

/**
 * Difficulty rating for adaptive learning
 * 1 = Beginner, 10 = Expert
 */
export type DifficultyRating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/**
 * Unified Lexicon Entry interface
 * 
 * This schema supports all three game modes:
 * - Recognition: term + definition matching
 * - Recall: definition → term retrieval  
 * - Transfer: cross-language semantic mapping
 * 
 * All fields are required for mode-ready data.
 */
export interface LexiconEntry {
  /** Unique identifier for the entry */
  readonly id: string
  /** Concept identifier for semantic grouping */
  readonly conceptId: string
  /** Multi-language translations keyed by ISO 639-1 code */
  readonly translations: { [lang: string]: string }
  /** Multi-language definitions keyed by ISO 639-1 code */
  readonly definitions: { [lang: string]: string }
  /** Polysemy rating (1-5) for semantic ambiguity handling */
  readonly polysemy: PolysemyRating
  /** Difficulty rating (1-10) for adaptive learning */
  readonly difficulty: DifficultyRating
  /** Physical location in source dictionary (optional, for reference games) */
  readonly coord?: WordCoordinate
}

/**
 * Legacy LexiconWord interface (deprecated - use LexiconEntry)
 * @deprecated Use LexiconEntry instead
 */
export interface LexiconWord {
  id: string
  conceptId: string
  translations: { [lang: string]: string }
  definitions: { [lang: string]: string }
  coord: WordCoordinate
}

export interface LexiconDataset {
  words: LexiconEntry[]
}
