import type { AnswerRecord, GameState, RoundSpec } from './types.ts'

export const selectCurrentRound = (state: GameState): RoundSpec | null =>
  state.deck[state.currentRound] ?? null

export const selectAnswerForRound = (
  state: GameState,
  roundIndex: number,
): AnswerRecord | null =>
  state.answers.find((answer) => answer.roundIndex === roundIndex) ?? null

export const selectCurrentAnswer = (state: GameState): AnswerRecord | null =>
  selectAnswerForRound(state, state.currentRound)

export const selectScore = (state: GameState): number =>
  state.answers.filter((answer) => answer.correct).length

export const selectStreak = (state: GameState): number => state.streak

export const selectProgress = (state: GameState): { current: number; total: number } => ({
  current: Math.min(state.currentRound + 1, state.deck.length),
  total: state.deck.length,
})

export const selectIsLastRound = (state: GameState): boolean =>
  state.deck.length > 0 && state.currentRound >= state.deck.length - 1

export const selectCurrentLanguage = (state: GameState): string => state.currentLanguage

export const selectCurrentDifficulty = (state: GameState): number => state.currentDifficulty
