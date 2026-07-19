/** One selectable definition in a round. Exactly one choice is `correct`. */
export interface Choice {
  readonly id: string
  readonly text: string
  readonly correct: boolean
}

/**
 * A fully-resolved round: the prompt term plus its shuffled candidate
 * definitions. Rounds are built outside the domain (impure shuffling) and
 * handed to the domain via the `startGame` command, keeping the decider pure
 * and the event log deterministically replayable.
 */
export interface RoundSpec {
  readonly wordId: string
  readonly term: string
  readonly partOfSpeech: string
  readonly choices: readonly Choice[]
  readonly milestone_id?: number
}

export type GameStatus = 'idle' | 'playing' | 'finished'

export interface AnswerRecord {
  readonly roundIndex: number
  readonly choiceId: string
  readonly correct: boolean
}

/**
 * Proficiency tracking for individual words
 * Tracks correct/total attempts for spaced repetition calculations
 */
export interface WordProficiency {
  readonly wordId: string
  readonly correct: number
  readonly total: number
  readonly lastAttemptedAt?: number
}

/**
 * Proficiency map for all words encountered by the user
 * Keyed by wordId for efficient lookup
 */
export type ProficiencyMap = ReadonlyMap<string, WordProficiency>

/**
 * User performance tracking for adaptive difficulty tuning
 * Tracks success rates per word and semantic group for confidence calculations
 */
export interface WordPerformance {
  readonly wordId: string
  readonly semantic_group: string
  readonly attempts: number
  readonly correct: number
  readonly lastAttemptedAt?: number
}

/**
 * Performance state aggregated by semantic groups
 * Used for confidence-based SRS rebalancing
 */
export interface SemanticGroupPerformance {
  readonly semantic_group: string
  readonly totalAttempts: number
  readonly correctAnswers: number
  readonly successRate: number
}

/**
 * User performance state aggregated across all interactions
 * Used by the decider for adaptive difficulty tuning
 */
export interface UserPerformanceState {
  readonly wordPerformance: ReadonlyMap<string, WordPerformance>
  readonly groupPerformance: ReadonlyMap<string, SemanticGroupPerformance>
  readonly globalSuccessRate: number
  readonly totalAttempts: number
}

/**
 * Create an empty user performance state for initialization
 */
export function createEmptyUserPerformanceState(): UserPerformanceState {
  return {
    wordPerformance: new Map(),
    groupPerformance: new Map(),
    globalSuccessRate: 0,
    totalAttempts: 0,
  }
}

/** State is a pure projection of the game event log — never mutated directly. */
export interface GameState {
  readonly status: GameStatus
  readonly deck: readonly RoundSpec[]
  readonly currentRound: number
  readonly answers: readonly AnswerRecord[]
  /** Consecutive correct answers; reset to 0 on a wrong answer or `resetStreak`. */
  readonly streak: number
  /** Current language for the game (defaults to 'en'). */
  readonly currentLanguage: string
  /** Current difficulty level (1-10), adjusted by AI agents. */
  readonly currentDifficulty: number
  /** Current milestone level (1 = Foundational, 2+ = Advanced) */
  readonly current_milestone: number
  /** Proficiency tracking for spaced repetition logic */
  readonly proficiency_map: ProficiencyMap
  /** User performance state for adaptive difficulty tuning */
  readonly user_performance: UserPerformanceState
}
