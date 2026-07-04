/** A source of randomness in the `[0, 1)` range, mirroring `Math.random`. */
export type Rng = () => number

/**
 * Returns a new, shuffled copy of `items` using the Fisher-Yates algorithm.
 * The input array is never mutated. Randomness is injected so callers (and
 * tests) can supply a deterministic {@link Rng}.
 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const a = result[i]!
    const b = result[j]!
    result[i] = b
    result[j] = a
  }
  return result
}

/** Returns `count` distinct items sampled from `items` without mutating it. */
export function sample<T>(items: readonly T[], count: number, rng: Rng = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(count, items.length)))
}

/**
 * Creates a small, seedable pseudo-random generator (mulberry32). Useful for
 * reproducible decks in tests and for deterministic event-log replay.
 */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
