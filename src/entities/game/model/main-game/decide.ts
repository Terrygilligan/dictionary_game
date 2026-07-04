import type { Decider } from '@/shared/event-sourcing'
import type { MainGameCommand } from './commands.ts'
import type { MainGameEvent } from './events.ts'
import type { MainGameState } from './types.ts'
import { columnCount, hasAnyWord, inRange, pageCount, resolveWordId, scrollCount, wordCount } from './layout.ts'

/**
 * Pure decision function for the Dictionary Game. Given the derived state and a
 * command, returns the events it produces; invalid intents (wrong phase, out of
 * bounds, or before a layout exists) yield `[]`.
 *
 * The phase gate enforces the ordered walk Scroll → Page → Column → Word Number,
 * and the Blind Arbiter split: `sealWord` computes and hides the word,
 * `revealWord` is the only path that surfaces it.
 */
export const decideMainGame: Decider<MainGameState, MainGameCommand, MainGameEvent> = (
  state,
  command,
) => {
  switch (command.type) {
    case 'startGame': {
      if (!hasAnyWord(command.layout)) return []
      return [{ type: 'game/started', layout: command.layout }]
    }

    case 'selectScroll': {
      if (state.phase !== 'scroll' || !state.layout) return []
      if (!inRange(command.scroll, scrollCount(state.layout))) return []
      return [{ type: 'scroll/selected', scroll: command.scroll }]
    }

    case 'selectPage': {
      const { layout, coordinates } = state
      if (state.phase !== 'page' || !layout || coordinates.scroll === null) return []
      if (!inRange(command.page, pageCount(layout, coordinates.scroll))) return []
      return [{ type: 'page/selected', page: command.page }]
    }

    case 'selectColumn': {
      const { layout, coordinates } = state
      if (state.phase !== 'column' || !layout) return []
      if (coordinates.scroll === null || coordinates.page === null) return []
      if (!inRange(command.column, columnCount(layout, coordinates.scroll, coordinates.page))) {
        return []
      }
      return [{ type: 'column/selected', column: command.column }]
    }

    case 'selectWordNumber': {
      const { layout, coordinates } = state
      if (state.phase !== 'wordNumber' || !layout) return []
      if (coordinates.scroll === null || coordinates.page === null || coordinates.column === null) {
        return []
      }
      const count = wordCount(layout, coordinates.scroll, coordinates.page, coordinates.column)
      if (!inRange(command.wordNumber, count)) return []
      return [{ type: 'wordNumber/selected', wordNumber: command.wordNumber }]
    }

    case 'sealWord': {
      const { layout, coordinates } = state
      if (state.phase !== 'ready' || !layout) return []
      const { scroll, page, column, wordNumber } = coordinates
      if (scroll === null || page === null || column === null || wordNumber === null) return []
      const wordId = resolveWordId(layout, scroll, page, column, wordNumber)
      if (wordId === null) return []
      return [{ type: 'word/sealed', secretWordId: wordId }]
    }

    case 'revealWord': {
      if (state.phase !== 'sealed' || state.secretWordId === null) return []
      return [{ type: 'word/revealed', wordId: state.secretWordId }]
    }

    default:
      return assertNever(command)
  }
}

function assertNever(command: never): never {
  throw new Error(`Unhandled main-game command: ${JSON.stringify(command)}`)
}
