import { describe, expect, it } from 'vitest'
import { decideMainGame } from './decide.ts'
import { evolveMainGame, initialMainGameState } from './state.ts'
import {
  selectCurrentOptionCount,
  selectIsRevealed,
  selectIsSealed,
  selectPhase,
  selectRevealedWordId,
} from './selectors.ts'
import type { MainGameCommand } from './commands.ts'
import type { MainGameEvent } from './events.ts'
import type { LexiconLayout, MainGameState } from './types.ts'

/**
 * A tiny 2-scroll layout. The target coordinate (0,0,1,1) resolves to `w-secret`.
 *   scroll 0 "A–M" → page 0 → column 0 → [w-a0, w-a1]
 *                              column 1 → [w-b0, w-secret]
 *   scroll 1 "N–Z" → page 0 → column 0 → [w-c0]
 */
const layout: LexiconLayout = {
  scrolls: [
    {
      label: 'A–M',
      pages: [
        {
          columns: [
            { wordIds: ['w-a0', 'w-a1'] },
            { wordIds: ['w-b0', 'w-secret'] },
          ],
        },
      ],
    },
    {
      label: 'N–Z',
      pages: [{ columns: [{ wordIds: ['w-c0'] }] }],
    },
  ],
}

/** Applies a command through decide -> evolve, mirroring the store. */
function run(state: MainGameState, command: MainGameCommand): MainGameState {
  const commandWithIdentity = {
    ...command,
    tenant_id: 'test-tenant',
    aggregate_id: 'test-aggregate'
  }
  const context = {
    timestamp: 1234567890, // Static timestamp for deterministic testing
    userId: 'test-user',
    correlationId: 'test-correlation'
  }
  return decideMainGame(state, commandWithIdentity, context).reduce<MainGameState>(evolveMainGame, state)
}

/** Drives the machine to `ready` with the coordinate pointing at `w-secret`. */
function toReady(): MainGameState {
  let state = run(initialMainGameState, { type: 'startGame', layout })
  state = run(state, { type: 'selectScroll', scroll: 0 })
  state = run(state, { type: 'selectPage', page: 0 })
  state = run(state, { type: 'selectColumn', column: 1 })
  state = run(state, { type: 'selectWordNumber', wordNumber: 1 })
  return state
}

describe('main game — phased selection', () => {
  it('starts in the scroll phase with a layout', () => {
    const state = run(initialMainGameState, { type: 'startGame', layout })
    expect(selectPhase(state)).toBe('scroll')
    expect(selectCurrentOptionCount(state)).toBe(2)
  })

  it('rejects startGame when no layout has any word', () => {
    const empty: LexiconLayout = { scrolls: [{ label: 'X', pages: [] }] }
    const context = {
      timestamp: 1234567890,
      userId: 'test-user',
      correlationId: 'test-correlation'
    }
    expect(decideMainGame(initialMainGameState, { type: 'startGame', layout: empty }, context)).toEqual([])
  })

  it('walks scroll → page → column → wordNumber → ready', () => {
    let state = run(initialMainGameState, { type: 'startGame', layout })
    state = run(state, { type: 'selectScroll', scroll: 0 })
    expect(selectPhase(state)).toBe('page')
    state = run(state, { type: 'selectPage', page: 0 })
    expect(selectPhase(state)).toBe('column')
    state = run(state, { type: 'selectColumn', column: 1 })
    expect(selectPhase(state)).toBe('wordNumber')
    expect(selectCurrentOptionCount(state)).toBe(2)
    state = run(state, { type: 'selectWordNumber', wordNumber: 1 })
    expect(selectPhase(state)).toBe('ready')
    expect(state.coordinates).toEqual({ scroll: 0, page: 0, column: 1, wordNumber: 1 })
  })

  it('rejects out-of-order commands', () => {
    const started = run(initialMainGameState, { type: 'startGame', layout })
    const context = {
      timestamp: 1234567890,
      userId: 'test-user',
      correlationId: 'test-correlation'
    }
    // Cannot pick a page before a scroll.
    expect(decideMainGame(started, { type: 'selectPage', page: 0 }, context)).toEqual([])
    // Cannot seal before all coordinates are chosen.
    expect(decideMainGame(started, { type: 'sealWord' }, context)).toEqual([])
  })

  it('rejects out-of-bounds selections', () => {
    const started = run(initialMainGameState, { type: 'startGame', layout })
    const context = {
      timestamp: 1234567890,
      userId: 'test-user',
      correlationId: 'test-correlation'
    }
    expect(decideMainGame(started, { type: 'selectScroll', scroll: 2 }, context)).toEqual([])
    expect(decideMainGame(started, { type: 'selectScroll', scroll: -1 }, context)).toEqual([])
    expect(decideMainGame(started, { type: 'selectScroll', scroll: 1.5 }, context)).toEqual([])

    const onColumn = run(
      run(started, { type: 'selectScroll', scroll: 1 }),
      { type: 'selectPage', page: 0 },
    )
    // Scroll 1 / page 0 has a single column (index 0); index 1 is out of range.
    expect(decideMainGame(onColumn, { type: 'selectColumn', column: 1 }, context)).toEqual([])
  })
})

describe('main game — blind arbiter', () => {
  it('seals the resolved word without exposing it via any selector', () => {
    const sealed = run(toReady(), { type: 'sealWord' })
    expect(selectPhase(sealed)).toBe('sealed')
    expect(selectIsSealed(sealed)).toBe(true)
    expect(selectIsRevealed(sealed)).toBe(false)
    // The word is secret: no selector surfaces it while sealed.
    expect(selectRevealedWordId(sealed)).toBeNull()
  })

  it('only surfaces the word after an explicit reveal', () => {
    const sealed = run(toReady(), { type: 'sealWord' })
    const revealed = run(sealed, { type: 'revealWord' })
    expect(selectPhase(revealed)).toBe('revealed')
    expect(selectIsRevealed(revealed)).toBe(true)
    expect(selectRevealedWordId(revealed)).toBe('w-secret')
  })

  it('rejects revealWord before a word is sealed', () => {
    const context = {
      timestamp: 1234567890,
      userId: 'test-user',
      correlationId: 'test-correlation'
    }
    expect(decideMainGame(toReady(), { type: 'revealWord' }, context)).toEqual([])
  })

  it('produces a deterministic event sequence for a full game', () => {
    const commands: MainGameCommand[] = [
      { type: 'startGame', layout },
      { type: 'selectScroll', scroll: 0 },
      { type: 'selectPage', page: 0 },
      { type: 'selectColumn', column: 1 },
      { type: 'selectWordNumber', wordNumber: 1 },
      { type: 'sealWord' },
      { type: 'revealWord' },
    ]

    let state = initialMainGameState
    const log: MainGameEvent[] = []
    const context = {
      timestamp: 1234567890,
      userId: 'test-user',
      correlationId: 'test-correlation'
    }
    for (const command of commands) {
      const events = decideMainGame(state, command, context)
      log.push(...events)
      state = events.reduce<MainGameState>(evolveMainGame, state)
    }

    expect(log.map((event) => event.type)).toEqual([
      'game/started',
      'scroll/selected',
      'page/selected',
      'column/selected',
      'wordNumber/selected',
      'word/sealed',
      'word/revealed',
    ])
    // Replaying the same log yields identical state (event sourcing invariant).
    const replayed = log.reduce<MainGameState>(evolveMainGame, initialMainGameState)
    expect(replayed).toEqual(state)
    expect(selectRevealedWordId(replayed)).toBe('w-secret')
  })
})
