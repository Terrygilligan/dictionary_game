export type {
  LexiconColumn,
  LexiconPage,
  LexiconScroll,
  LexiconLayout,
  Coordinates,
  MainGamePhase,
  MainGameState,
} from './types.ts'
export type { MainGameEvent, MainGameEventType } from './events.ts'
export type { MainGameCommand } from './commands.ts'
export { initialMainGameState, evolveMainGame } from './state.ts'
export { decideMainGame } from './decide.ts'
export {
  selectPhase,
  selectCoordinates,
  selectScrollLabels,
  selectCurrentOptionCount,
  selectIsSealed,
  selectIsRevealed,
  selectRevealedWordId,
} from './selectors.ts'
export {
  inRange,
  scrollCount,
  pageCount,
  columnCount,
  wordCount,
  resolveWordId,
  hasAnyWord,
} from './layout.ts'
