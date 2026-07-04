import type { LexiconLayout } from './types.ts'

/** True when `n` is a valid zero-based index into a collection of `count` items. */
export const inRange = (n: number, count: number): boolean =>
  Number.isInteger(n) && n >= 0 && n < count

export const scrollCount = (layout: LexiconLayout): number => layout.scrolls.length

export const pageCount = (layout: LexiconLayout, scroll: number): number =>
  layout.scrolls[scroll]?.pages.length ?? 0

export const columnCount = (layout: LexiconLayout, scroll: number, page: number): number =>
  layout.scrolls[scroll]?.pages[page]?.columns.length ?? 0

export const wordCount = (
  layout: LexiconLayout,
  scroll: number,
  page: number,
  column: number,
): number => layout.scrolls[scroll]?.pages[page]?.columns[column]?.wordIds.length ?? 0

/**
 * Resolve a full coordinate to its word id, or `null` if the coordinate falls
 * outside the layout. Pure and total — the sole coordinate→word mapping.
 */
export const resolveWordId = (
  layout: LexiconLayout,
  scroll: number,
  page: number,
  column: number,
  wordNumber: number,
): string | null =>
  layout.scrolls[scroll]?.pages[page]?.columns[column]?.wordIds[wordNumber] ?? null

/** A layout is playable only if it has at least one addressable word. */
export const hasAnyWord = (layout: LexiconLayout): boolean =>
  layout.scrolls.some((s) => s.pages.some((p) => p.columns.some((c) => c.wordIds.length > 0)))
