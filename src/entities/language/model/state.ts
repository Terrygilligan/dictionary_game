/**
 * Language Learning State Model
 * 
 * Defines the developmental stages and linguistic state for language learning
 * following the Event-Driven Architecture Blueprint with immutable state patterns.
 */

/**
 * Developmental stages for language learning progression
 * Based on established language acquisition research
 */
export enum DevelopmentalStage {
  /** INFANT: Basic word recognition (0-20 mastered words) */
  INFANT = 'INFANT',
  /** TODDLER: Simple word associations (21-50 mastered words) */
  TODDLER = 'TODDLER', 
  /** SCHOOLER: Contextual understanding (51-150 mastered words) */
  SCHOOLER = 'SCHOOLER',
  /** CONVERSATIONAL: Advanced usage (150+ mastered words) */
  CONVERSATIONAL = 'CONVERSATIONAL'
}

/**
 * Missed word tracking for targeted learning
 * Tracks words the learner struggles with for focused practice
 */
export interface MissedWord {
  /** The word that was missed */
  readonly word: string
  /** Number of times this word was missed */
  readonly count: number
  /** Timestamp of last miss for recency tracking */
  readonly lastMissed: number
  /** Total attempts for calculating miss rate */
  readonly attempts: number
}

/**
 * Focus topic areas for personalized learning
 * Helps guide content selection based on learner interests
 */
export interface FocusTopic {
  /** Topic identifier */
  readonly id: string
  /** Topic display name */
  readonly name: string
  /** Priority level for this topic */
  readonly priority: number
  /** Last practiced timestamp */
  readonly lastPracticed?: number
}

/**
 * Linguistic State Interface
 * 
 * Represents the complete language learning state for a specific tenant.
 * This is a pure projection of the event log - never mutated directly.
 * 
 * Following Event-Driven Architecture Blueprint:
 * - Immutable state structure
 * - Tenant-specific projection
 * - Event-driven state evolution
 */
export interface LinguisticState {
  /** Current developmental stage in language learning */
  readonly stage: DevelopmentalStage
  
  /** Array of mastered words (learned and retained) */
  readonly masteredWords: readonly string[]
  
  /** Current difficulty level (1-10) for content selection */
  readonly difficultyLevel: number
  
  /** Focus topics for personalized learning paths */
  readonly focusTopics: readonly FocusTopic[]
  
  /** Words the learner struggles with, tracked for improvement */
  readonly missedWords: readonly MissedWord[]
  
  /** Total number of practice sessions completed */
  readonly sessionsCompleted: number
  
  /** Total correct answers across all sessions */
  readonly totalCorrect: number
  
  /** Total incorrect answers across all sessions */
  readonly totalIncorrect: number
  
  /** Current streak of consecutive correct answers */
  readonly currentStreak: number
  
  /** Longest streak achieved */
  readonly longestStreak: number
  
  /** Timestamp of last learning activity */
  readonly lastActivity: number
  
  /** Preferred learning language */
  readonly targetLanguage: string
  
  /** Native language for translation context */
  readonly nativeLanguage: string
}

/**
 * Initial Linguistic State
 * 
 * Default state for new language learners following
 * Event-Driven Architecture Blueprint patterns
 */
export const initialLinguisticState: LinguisticState = {
  stage: DevelopmentalStage.INFANT,
  masteredWords: [],
  difficultyLevel: 1,
  focusTopics: [],
  missedWords: [],
  sessionsCompleted: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivity: Date.now(),
  targetLanguage: 'en',
  nativeLanguage: 'en'
}

/**
 * Developmental Stage Thresholds
 * 
 * Defines the requirements for progressing between stages
 * Based on language acquisition research and pedagogical best practices
 */
export const STAGE_THRESHOLDS = {
  [DevelopmentalStage.INFANT]: {
    masteredWordsRequired: 0,
    difficultyRange: [1, 2],
    description: 'Basic word recognition and simple associations'
  },
  [DevelopmentalStage.TODDLER]: {
    masteredWordsRequired: 20,
    difficultyRange: [2, 4],
    description: 'Simple word associations and basic vocabulary'
  },
  [DevelopmentalStage.SCHOOLER]: {
    masteredWordsRequired: 50,
    difficultyRange: [4, 7],
    description: 'Contextual understanding and intermediate vocabulary'
  },
  [DevelopmentalStage.CONVERSATIONAL]: {
    masteredWordsRequired: 150,
    difficultyRange: [7, 10],
    description: 'Advanced usage and conversational fluency'
  }
} as const

/**
 * Helper functions for LinguisticState manipulation
 * Following functional programming principles for immutability
 */

/**
 * Determine the appropriate developmental stage based on mastered words
 */
export function determineDevelopmentalStage(masteredWordsCount: number): DevelopmentalStage {
  if (masteredWordsCount >= 150) return DevelopmentalStage.CONVERSATIONAL
  if (masteredWordsCount >= 50) return DevelopmentalStage.SCHOOLER
  if (masteredWordsCount >= 20) return DevelopmentalStage.TODDLER
  return DevelopmentalStage.INFANT
}

/**
 * Calculate accuracy rate from correct and incorrect answers
 */
export function calculateAccuracy(totalCorrect: number, totalIncorrect: number): number {
  const total = totalCorrect + totalIncorrect
  return total > 0 ? Math.round((totalCorrect / total) * 100) : 0
}

/**
 * Calculate miss rate for a specific word
 */
export function calculateMissRate(missedWord: MissedWord): number {
  return missedWord.attempts > 0 ? Math.round((missedWord.count / missedWord.attempts) * 100) : 0
}

/**
 * Get words that need practice based on miss rate and recency
 */
export function getWordsNeedingPractice(missedWords: readonly MissedWord[], threshold: number = 50): readonly string[] {
  return missedWords
    .filter(mw => calculateMissRate(mw) >= threshold)
    .sort((a, b) => b.lastMissed - a.lastMissed) // Most recent first
    .map(mw => mw.word)
}

/**
 * Check if learner is ready for stage progression
 */
export function isReadyForStageProgression(state: LinguisticState): boolean {
  const nextStage = getNextStage(state.stage)
  
  if (!nextStage) return false
  
  const nextThreshold = STAGE_THRESHOLDS[nextStage]
  return state.masteredWords.length >= nextThreshold.masteredWordsRequired
}

/**
 * Get the next developmental stage
 */
export function getNextStage(currentStage: DevelopmentalStage): DevelopmentalStage | null {
  switch (currentStage) {
    case DevelopmentalStage.INFANT:
      return DevelopmentalStage.TODDLER
    case DevelopmentalStage.TODDLER:
      return DevelopmentalStage.SCHOOLER
    case DevelopmentalStage.SCHOOLER:
      return DevelopmentalStage.CONVERSATIONAL
    case DevelopmentalStage.CONVERSATIONAL:
      return null // Maximum stage reached
    default:
      return null
  }
}

/**
 * Validate LinguisticState integrity
 */
export function validateLinguisticState(state: LinguisticState): boolean {
  // Check that masteredWords are unique
  const uniqueWords = new Set(state.masteredWords)
  if (uniqueWords.size !== state.masteredWords.length) {
    return false
  }
  
  // Check that missed words have valid counts
  for (const missed of state.missedWords) {
    if (missed.count < 0 || missed.count > missed.attempts) {
      return false
    }
  }
  
  // Check that difficulty level is within valid range
  if (state.difficultyLevel < 1 || state.difficultyLevel > 10) {
    return false
  }
  
  // Check that streaks are non-negative
  if (state.currentStreak < 0 || state.longestStreak < 0) {
    return false
  }
  
  return true
}
