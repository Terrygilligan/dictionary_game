import type { Coordinates, MainGamePhase, MainGameState } from './types.ts'
import { columnCount, pageCount, scrollCount, wordCount } from './layout.ts'

export const selectPhase = (state: MainGameState): MainGamePhase => state.phase

export const selectCoordinates = (state: MainGameState): Coordinates => state.coordinates

/** Labels for the available scrolls (e.g. `A–E`), for rendering the first phase. */
export const selectScrollLabels = (state: MainGameState): readonly string[] =>
  state.layout?.scrolls.map((s) => s.label) ?? []

/**
 * How many options the *current* phase offers, given prior selections, or `null`
 * outside a selection phase. Lets the UI render choices without touching layout
 * internals or the secret.
 */
export const selectCurrentOptionCount = (state: MainGameState): number | null => {
  const { layout, coordinates, phase } = state
  if (!layout) return null
  switch (phase) {
    case 'scroll':
      return scrollCount(layout)
    case 'page':
      return coordinates.scroll === null ? null : pageCount(layout, coordinates.scroll)
    case 'column':
      return coordinates.scroll === null || coordinates.page === null
        ? null
        : columnCount(layout, coordinates.scroll, coordinates.page)
    case 'wordNumber':
      return coordinates.scroll === null ||
        coordinates.page === null ||
        coordinates.column === null
        ? null
        : wordCount(layout, coordinates.scroll, coordinates.page, coordinates.column)
    default:
      return null
  }
}

export const selectIsSealed = (state: MainGameState): boolean =>
  state.phase === 'sealed' || state.phase === 'revealed'

export const selectIsRevealed = (state: MainGameState): boolean => state.phase === 'revealed'

/**
 * The word's public identity — Blind Arbiter's single legitimate exit. Returns
 * `null` until a `word/revealed` event has been folded in, even while the word
 * is sealed in `secretWordId`. There is intentionally **no** selector for the
 * secret.
 */
export const selectRevealedWordId = (state: MainGameState): string | null =>
  state.revealedWordId
