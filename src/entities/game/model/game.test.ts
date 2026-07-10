import { describe, expect, it } from 'vitest'
import { decideGame } from './decide.ts'
import { evolveGame, initialGameState } from './state.ts'
import { selectScore, selectStreak } from './selectors.ts'
import type { GameCommand } from './commands.ts'
import type { GameEvent } from './events.ts'
import type { GameState, RoundSpec } from './types.ts'

const round = (term: string, correctId: string): RoundSpec => ({
  wordId: term,
  term,
  partOfSpeech: 'noun',
  choices: [
    { id: `${term}-a`, text: 'a', correct: correctId === `${term}-a` },
    { id: `${term}-b`, text: 'b', correct: correctId === `${term}-b` },
  ],
})

const deck: RoundSpec[] = [round('alpha', 'alpha-a'), round('beta', 'beta-b')]

/** Applies a command through decide -> evolve, mirroring the store. */
function run(state: GameState, command: GameCommand): GameState {
  const commandWithIdentity = {
    ...command,
    tenant_id: 'test-tenant',
    aggregate_id: 'test-aggregate'
  }
  return decideGame(state, commandWithIdentity).reduce<GameState>(evolveGame, state)
}

describe('game domain', () => {
  it('starts a game from an empty state', () => {
    const state = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    expect(state.status).toBe('playing')
    expect(state.deck).toHaveLength(2)
    expect(state.currentRound).toBe(0)
  })

  it('ignores startGame with an empty deck', () => {
    expect(decideGame(initialGameState, { type: 'startGame', deck: [], tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })).toEqual([])
  })

  it('records a submitted answer with correctness', () => {
    const started = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    const answered = run(started, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    expect(answered.answers).toEqual([
      { roundIndex: 0, choiceId: 'alpha-a', correct: true },
    ])
  })

  it('rejects a second answer for the same round', () => {
    const started = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    const answered = run(started, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    expect(decideGame(answered, { type: 'submitAnswer', choiceId: 'alpha-b', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })).toEqual([])
  })

  it('cannot advance before answering', () => {
    const started = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    expect(decideGame(started, { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })).toEqual([])
  })

  it('finishes after the last round and derives the final score', () => {
    let state = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    state = run(state, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // correct
    state = run(state, { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
    expect(state.currentRound).toBe(1)
    state = run(state, { type: 'submitAnswer', choiceId: 'beta-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // wrong
    state = run(state, { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })

    expect(state.status).toBe('finished')
    expect(selectScore(state)).toBe(1)
  })

  it('produces a deterministic event sequence for a full game', () => {
    const commands: GameCommand[] = [
      { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' },
      { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' },
      { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' },
      { type: 'submitAnswer', choiceId: 'beta-b', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' },
      { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' },
    ]

    let state = initialGameState
    const log: GameEvent[] = []
    for (const command of commands) {
      const events = decideGame(state, command)
      log.push(...events)
      state = events.reduce<GameState>(evolveGame, state)
    }

    expect(log.map((event) => event.type)).toEqual([
      'game/started',
      'answer/submitted',
      'streak/updated',
      'round/advanced',
      'answer/submitted',
      'streak/updated',
      'game/finished',
    ])
    expect(selectScore(state)).toBe(2)
  })

  describe('streak', () => {
    it('increments on consecutive correct answers', () => {
      let state = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      expect(selectStreak(state)).toBe(0)
      state = run(state, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // correct
      expect(selectStreak(state)).toBe(1)
      state = run(state, { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      state = run(state, { type: 'submitAnswer', choiceId: 'beta-b', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // correct
      expect(selectStreak(state)).toBe(2)
    })

    it('resets to 0 on an incorrect answer', () => {
      let state = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      state = run(state, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // correct
      expect(selectStreak(state)).toBe(1)
      state = run(state, { type: 'nextRound', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      state = run(state, { type: 'submitAnswer', choiceId: 'beta-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // wrong
      expect(selectStreak(state)).toBe(0)
    })

    it('emits answer/submitted before streak/updated', () => {
      const started = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      const events = decideGame(started, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      expect(events.map((e) => e.type)).toEqual(['answer/submitted', 'streak/updated'])
      expect(events[1]).toEqual({ type: 'streak/updated', streak: 1 })
    })

    it('resetStreak clears a non-zero streak', () => {
      let state = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      state = run(state, { type: 'submitAnswer', choiceId: 'alpha-a', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' }) // correct
      expect(selectStreak(state)).toBe(1)
      state = run(state, { type: 'resetStreak', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      expect(selectStreak(state)).toBe(0)
    })

    it('resetStreak is a no-op when the streak is already 0', () => {
      const started = run(initialGameState, { type: 'startGame', deck, tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })
      expect(decideGame(started, { type: 'resetStreak', tenant_id: 'test-tenant', aggregate_id: 'test-aggregate' })).toEqual([])
    })
  })
})
