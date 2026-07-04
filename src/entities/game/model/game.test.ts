import { describe, expect, it } from 'vitest'
import { decideGame } from './decide.ts'
import { evolveGame, initialGameState } from './state.ts'
import { selectScore } from './selectors.ts'
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
  return decideGame(state, command).reduce<GameState>(evolveGame, state)
}

describe('game domain', () => {
  it('starts a game from an empty state', () => {
    const state = run(initialGameState, { type: 'startGame', deck })
    expect(state.status).toBe('playing')
    expect(state.deck).toHaveLength(2)
    expect(state.currentRound).toBe(0)
  })

  it('ignores startGame with an empty deck', () => {
    expect(decideGame(initialGameState, { type: 'startGame', deck: [] })).toEqual([])
  })

  it('records a submitted answer with correctness', () => {
    const started = run(initialGameState, { type: 'startGame', deck })
    const answered = run(started, { type: 'submitAnswer', choiceId: 'alpha-a' })
    expect(answered.answers).toEqual([
      { roundIndex: 0, choiceId: 'alpha-a', correct: true },
    ])
  })

  it('rejects a second answer for the same round', () => {
    const started = run(initialGameState, { type: 'startGame', deck })
    const answered = run(started, { type: 'submitAnswer', choiceId: 'alpha-a' })
    expect(decideGame(answered, { type: 'submitAnswer', choiceId: 'alpha-b' })).toEqual([])
  })

  it('cannot advance before answering', () => {
    const started = run(initialGameState, { type: 'startGame', deck })
    expect(decideGame(started, { type: 'nextRound' })).toEqual([])
  })

  it('finishes after the last round and derives the final score', () => {
    let state = run(initialGameState, { type: 'startGame', deck })
    state = run(state, { type: 'submitAnswer', choiceId: 'alpha-a' }) // correct
    state = run(state, { type: 'nextRound' })
    expect(state.currentRound).toBe(1)
    state = run(state, { type: 'submitAnswer', choiceId: 'beta-a' }) // wrong
    state = run(state, { type: 'nextRound' })

    expect(state.status).toBe('finished')
    expect(selectScore(state)).toBe(1)
  })

  it('produces a deterministic event sequence for a full game', () => {
    const commands: GameCommand[] = [
      { type: 'startGame', deck },
      { type: 'submitAnswer', choiceId: 'alpha-a' },
      { type: 'nextRound' },
      { type: 'submitAnswer', choiceId: 'beta-b' },
      { type: 'nextRound' },
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
      'round/advanced',
      'answer/submitted',
      'game/finished',
    ])
    expect(selectScore(state)).toBe(2)
  })
})
