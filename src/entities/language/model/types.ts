/**
 * Language Learning Types
 * 
 * Type definitions for the language learning entity following
 * Event-Driven Architecture Blueprint patterns.
 */

import type {
  DevelopmentalStage,
  MissedWord,
  FocusTopic
} from './state.ts'

// Re-export from state.ts for convenience
export type {
  DevelopmentalStage,
  LinguisticState,
  MissedWord,
  FocusTopic
} from './state.ts'

/**
 * Language Learning Events
 * 
 * Events specific to language learning that extend the base game events
 * These events would be emitted by the language learning projection
 */

/**
 * Event emitted when a learner progresses to a new developmental stage
 */
export interface StageProgressedEvent {
  readonly type: 'stage/progressed'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly previousStage: DevelopmentalStage
  readonly newStage: DevelopmentalStage
  readonly masteredWordsCount: number
  readonly timestamp: number
}

/**
 * Event emitted when a word is successfully mastered
 */
export interface WordMasteredEvent {
  readonly type: 'word/mastered'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly word: string
  readonly attempts: number
  readonly accuracy: number
  readonly timestamp: number
}

/**
 * Event emitted when focus topics are updated
 */
export interface FocusTopicsUpdatedEvent {
  readonly type: 'focus-topics/updated'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly previousTopics: readonly FocusTopic[]
  readonly newTopics: readonly FocusTopic[]
  readonly reason: string
  readonly timestamp: number
}

/**
 * Event emitted when learning patterns are analyzed
 */
export interface LearningPatternsAnalyzedEvent {
  readonly type: 'patterns/analyzed'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly patterns: {
    readonly accuracy: number
    readonly preferredTimeOfDay: number
    readonly averageSessionLength: number
    readonly strugglingCategories: readonly string[]
  }
  readonly recommendations: readonly string[]
  readonly timestamp: number
}

/**
 * Union type for all language learning events
 */
export type LanguageLearningEvent = 
  | StageProgressedEvent
  | WordMasteredEvent
  | FocusTopicsUpdatedEvent
  | LearningPatternsAnalyzedEvent

/**
 * Language Learning Commands
 * 
 * Commands that trigger language learning events
 */

/**
 * Command to manually update focus topics
 */
export interface UpdateFocusTopicsCommand {
  readonly type: 'update-focus-topics'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly topics: readonly FocusTopic[]
  readonly reason: string
}

/**
 * Command to reset learning progress
 */
export interface ResetProgressCommand {
  readonly type: 'reset-progress'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly scope: 'all' | 'stage' | 'difficulty'
  readonly reason: string
}

/**
 * Command to export learning analytics
 */
export interface ExportAnalyticsCommand {
  readonly type: 'export-analytics'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly format: 'json' | 'csv' | 'pdf'
  readonly dateRange?: {
    readonly start: number
    readonly end: number
  }
}

/**
 * Union type for all language learning commands
 */
export type LanguageLearningCommand = 
  | UpdateFocusTopicsCommand
  | ResetProgressCommand
  | ExportAnalyticsCommand

/**
 * Language Learning Analytics
 * 
 * Analytics data structures for reporting and insights
 */

/**
 * Comprehensive learning analytics
 */
export interface LearningAnalytics {
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly generatedAt: number
  
  // Progress metrics
  readonly currentStage: DevelopmentalStage
  readonly masteredWordsCount: number
  readonly totalWordsAttempted: number
  readonly accuracyRate: number
  
  // Session metrics
  readonly totalSessions: number
  readonly averageSessionLength: number
  readonly totalLearningTime: number
  
  // Streak metrics
  readonly currentStreak: number
  readonly longestStreak: number
  readonly averageStreakLength: number
  
  // Difficulty metrics
  readonly currentDifficulty: number
  readonly difficultyProgression: readonly number[]
  
  // Word-specific metrics
  readonly mostMissedWords: readonly MissedWord[]
  readonly recentlyMastered: readonly string[]
  readonly wordsNeedingPractice: readonly string[]
  
  // Focus topics
  readonly currentFocusTopics: readonly FocusTopic[]
  readonly topicCompletionRates: Record<string, number>
  
  // Learning patterns
  readonly preferredLearningTimes: readonly number[]
  readonly averageAccuracyByTimeOfDay: Record<string, number>
  readonly learningVelocity: number // Words learned per week
}

/**
 * Learning recommendations
 */
export interface LearningRecommendations {
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly generatedAt: number
  
  // Difficulty recommendations
  readonly recommendedDifficulty: number
  readonly difficultyAdjustmentReason: string
  
  // Content recommendations
  readonly recommendedWords: readonly string[]
  readonly recommendedTopics: readonly string[]
  readonly wordsToReview: readonly string[]
  
  // Practice recommendations
  readonly recommendedSessionLength: number
  readonly recommendedPracticeFrequency: string
  readonly optimalPracticeTimes: readonly number[]
  
  // Stage recommendations
  readonly readyForStageProgression: boolean
  readonly stageProgressionRequirements: readonly string[]
}

/**
 * Language Learning Configuration
 * 
 * Configuration options for language learning behavior
 */

/**
 * Developmental stage configuration
 */
export interface StageConfig {
  readonly stage: DevelopmentalStage
  readonly masteredWordsRequired: number
  readonly difficultyRange: readonly [number, number]
  readonly sessionLength: number
  readonly practiceFrequency: string
  readonly description: string
}

/**
 * Learning algorithm configuration
 */
export interface LearningConfig {
  readonly stageConfigs: readonly StageConfig[]
  readonly difficultyAdjustmentThreshold: number
  readonly missedWordThreshold: number
  readonly focusTopicCount: number
  readonly progressionCheckInterval: number
}

/**
 * Default learning configuration
 */
export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  stageConfigs: [
    {
      stage: 'INFANT' as DevelopmentalStage,
      masteredWordsRequired: 0,
      difficultyRange: [1, 2],
      sessionLength: 5, // 5 minutes
      practiceFrequency: 'daily',
      description: 'Basic word recognition and simple associations'
    },
    {
      stage: 'TODDLER' as DevelopmentalStage,
      masteredWordsRequired: 20,
      difficultyRange: [2, 4],
      sessionLength: 10, // 10 minutes
      practiceFrequency: 'daily',
      description: 'Simple word associations and basic vocabulary'
    },
    {
      stage: 'SCHOOLER' as DevelopmentalStage,
      masteredWordsRequired: 50,
      difficultyRange: [4, 7],
      sessionLength: 15, // 15 minutes
      practiceFrequency: 'every-other-day',
      description: 'Contextual understanding and intermediate vocabulary'
    },
    {
      stage: 'CONVERSATIONAL' as DevelopmentalStage,
      masteredWordsRequired: 150,
      difficultyRange: [7, 10],
      sessionLength: 20, // 20 minutes
      practiceFrequency: 'weekly',
      description: 'Advanced usage and conversational fluency'
    }
  ],
  difficultyAdjustmentThreshold: 10,
  missedWordThreshold: 3,
  focusTopicCount: 5,
  progressionCheckInterval: 5
}
