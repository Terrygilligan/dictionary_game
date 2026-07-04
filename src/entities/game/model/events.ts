import type { RoundSpec } from './types.ts'

/**
 * The immutable facts of a game. The event log is the single source of truth;
 * {@link GameState} is derived by folding these through the evolver.
 */
export type GameEvent =
  | { readonly type: 'game/started'; readonly deck: readonly RoundSpec[] }
  | {
      readonly type: 'answer/submitted'
      readonly roundIndex: number
      readonly choiceId: string
      readonly correct: boolean
    }
  | { readonly type: 'round/advanced'; readonly toRoundIndex: number }
  | { readonly type: 'streak/updated'; readonly streak: number }
  | { readonly type: 'game/finished'; readonly correct: number; readonly total: number }

export type GameEventType = GameEvent['type']
