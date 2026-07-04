import type { LexiconLayout } from './types.ts'

/**
 * The immutable facts of a Dictionary Game. The log is the single source of
 * truth; {@link MainGameState} is derived by folding these through the evolver.
 *
 * Note the Blind Arbiter split: `word/sealed` carries the id privately (the
 * evolver stashes it in `secretWordId`, which no selector reads), while
 * `word/revealed` is the *only* event that makes the word public.
 */
export type MainGameEvent =
  | { readonly type: 'game/started'; readonly layout: LexiconLayout }
  | { readonly type: 'scroll/selected'; readonly scroll: number }
  | { readonly type: 'page/selected'; readonly page: number }
  | { readonly type: 'column/selected'; readonly column: number }
  | { readonly type: 'wordNumber/selected'; readonly wordNumber: number }
  | { readonly type: 'word/sealed'; readonly secretWordId: string }
  | { readonly type: 'word/revealed'; readonly wordId: string }

export type MainGameEventType = MainGameEvent['type']
