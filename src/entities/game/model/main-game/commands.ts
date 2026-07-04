import type { LexiconLayout } from './types.ts'

/**
 * Intents emitted by the UI for the Dictionary Game. Commands are requests: the
 * decider rejects any that are invalid for the current phase (or out of bounds)
 * by producing no events, so the log only records legitimate transitions.
 */
export type MainGameCommand =
  | { readonly type: 'startGame'; readonly layout: LexiconLayout }
  | { readonly type: 'selectScroll'; readonly scroll: number }
  | { readonly type: 'selectPage'; readonly page: number }
  | { readonly type: 'selectColumn'; readonly column: number }
  | { readonly type: 'selectWordNumber'; readonly wordNumber: number }
  | { readonly type: 'sealWord' }
  | { readonly type: 'revealWord' }
