export type {
  Choice,
  RoundSpec,
  GameStatus,
  AnswerRecord,
  GameState,
} from './model/types.ts'
export type { GameCommand } from './model/commands.ts'
export type { GameEvent, GameEventType } from './model/events.ts'
export { initialGameState, evolveGame } from './model/state.ts'
export { decideGame } from './model/decide.ts'
export {
  selectCurrentRound,
  selectAnswerForRound,
  selectCurrentAnswer,
  selectScore,
  selectStreak,
  selectProgress,
  selectIsLastRound,
} from './model/selectors.ts'

// --- Main Game (the "Dictionary Game" — phased selection + Blind Arbiter) ---
export type {
  LexiconColumn,
  LexiconPage,
  LexiconScroll,
  LexiconLayout,
  Coordinates,
  MainGamePhase,
  MainGameState,
  MainGameEvent,
  MainGameEventType,
  MainGameCommand,
} from './model/main-game/index.ts'
export {
  initialMainGameState,
  evolveMainGame,
  decideMainGame,
  selectPhase,
  selectCoordinates,
  selectScrollLabels,
  selectCurrentOptionCount,
  selectIsSealed,
  selectIsRevealed,
  selectRevealedWordId,
  resolveWordId,
} from './model/main-game/index.ts'
