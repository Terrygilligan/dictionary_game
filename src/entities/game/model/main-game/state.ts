import type { Evolve } from '@/shared/event-sourcing'
import type { MainGameEvent } from './events.ts'
import type { MainGameState } from './types.ts'

const NO_COORDINATES = {
  scroll: null,
  page: null,
  column: null,
  wordNumber: null,
} as const

export const initialMainGameState: MainGameState = {
  phase: 'idle',
  layout: null,
  coordinates: NO_COORDINATES,
  secretWordId: null,
  revealedWordId: null,
}

/**
 * Pure fold: `(state, event) -> nextState`. Exhaustive over `MainGameEvent`.
 *
 * `word/sealed` stashes the id in `secretWordId` (never surfaced by a selector);
 * `word/revealed` is the only event that writes `revealedWordId`, honouring the
 * Blind Arbiter pattern.
 */
export const evolveMainGame: Evolve<MainGameState, MainGameEvent> = (state, event) => {
  switch (event.type) {
    case 'game/started':
      return {
        phase: 'scroll',
        layout: event.layout,
        coordinates: NO_COORDINATES,
        secretWordId: null,
        revealedWordId: null,
      }
    case 'scroll/selected':
      return {
        ...state,
        phase: 'page',
        coordinates: { ...state.coordinates, scroll: event.scroll },
      }
    case 'page/selected':
      return {
        ...state,
        phase: 'column',
        coordinates: { ...state.coordinates, page: event.page },
      }
    case 'column/selected':
      return {
        ...state,
        phase: 'wordNumber',
        coordinates: { ...state.coordinates, column: event.column },
      }
    case 'wordNumber/selected':
      return {
        ...state,
        phase: 'ready',
        coordinates: { ...state.coordinates, wordNumber: event.wordNumber },
      }
    case 'word/sealed':
      return { ...state, phase: 'sealed', secretWordId: event.secretWordId }
    case 'word/revealed':
      return { ...state, phase: 'revealed', revealedWordId: event.wordId }
    default:
      return assertNever(event)
  }
}

function assertNever(event: never): never {
  throw new Error(`Unhandled main-game event: ${JSON.stringify(event)}`)
}
