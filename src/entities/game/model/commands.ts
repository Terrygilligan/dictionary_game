import type { RoundSpec } from './types.ts'

/**
 * Intents emitted by the UI. Commands are requests — they may be rejected by
 * the decider (producing no events) when they are not valid for the current
 * state.
 */
export type GameCommand =
  | { readonly type: 'startGame'; readonly deck: readonly RoundSpec[] }
  | { readonly type: 'submitAnswer'; readonly choiceId: string }
  | { readonly type: 'nextRound' }
  | { readonly type: 'resetStreak' }
