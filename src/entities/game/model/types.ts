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
}

export type GameStatus = 'idle' | 'playing' | 'finished'

export interface AnswerRecord {
  readonly roundIndex: number
  readonly choiceId: string
  readonly correct: boolean
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
}
