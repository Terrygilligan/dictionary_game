/**
 * Domain types for the "Dictionary Game" (the Main Game / "Dealer" game).
 *
 * The player narrows a physical-dictionary coordinate in four ordered phases —
 * Scroll → Page → Column → Word Number — the arbiter then *seals* the resolved
 * word (kept secret), and only a later reveal exposes it. See SCRATCHPAD entry
 * 0004 for the rationale.
 *
 * This module is a self-contained domain: it never imports the `word` entity.
 * Words are referenced by opaque `wordId` strings carried in the layout, so the
 * decider/evolver stay pure and free of sibling-entity coupling.
 */

/** A single column on a dictionary page: an ordered list of word ids. */
export interface LexiconColumn {
  readonly wordIds: readonly string[]
}

/** A dictionary page: an ordered list of columns. */
export interface LexiconPage {
  readonly columns: readonly LexiconColumn[]
}

/**
 * A "scroll" — a section-index of the dictionary (e.g. `A–E`, `F–J`) that mimics
 * flicking to a region before turning to a page.
 */
export interface LexiconScroll {
  readonly label: string
  readonly pages: readonly LexiconPage[]
}

/**
 * The full addressable structure of the lexicon. Supplied once at `startGame`
 * and carried in the `game/started` event, making coordinate resolution a pure,
 * deterministic function of the log.
 */
export interface LexiconLayout {
  readonly scrolls: readonly LexiconScroll[]
}

/**
 * The four-part coordinate the player builds up. Each field is `null` until its
 * phase has been selected.
 */
export interface Coordinates {
  readonly scroll: number | null
  readonly page: number | null
  readonly column: number | null
  readonly wordNumber: number | null
}

/**
 * The phase of the selection state machine — i.e. what the arbiter is awaiting.
 *
 * `idle → scroll → page → column → wordNumber → ready → sealed → revealed`
 *
 * `ready` is the resting point once all four coordinates are chosen but the
 * arbiter has not yet sealed the word; `sealWord` moves `ready → sealed`.
 */
export type MainGamePhase =
  | 'idle'
  | 'scroll'
  | 'page'
  | 'column'
  | 'wordNumber'
  | 'ready'
  | 'sealed'
  | 'revealed'

/**
 * State is a pure projection of the Main Game event log — never mutated directly.
 *
 * Blind Arbiter: `secretWordId` holds the sealed word while it is secret. It is
 * deliberately **not** exposed by any selector; the word only becomes readable
 * through `revealedWordId`, which is populated solely by a `word/revealed` event.
 */
export interface MainGameState {
  readonly phase: MainGamePhase
  readonly layout: LexiconLayout | null
  readonly coordinates: Coordinates
  readonly secretWordId: string | null
  readonly revealedWordId: string | null
}
