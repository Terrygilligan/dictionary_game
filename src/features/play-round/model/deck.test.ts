import { afterEach, describe, expect, it } from 'vitest'
import { buildDeck } from './deck.ts'
import { seededRng } from '@/shared/lib'
import { resetIdFactory, setIdFactory } from '@/shared/lib'

afterEach(resetIdFactory)

describe('buildDeck', () => {
  it('builds the requested number of rounds with one correct choice each', () => {
    const deck = buildDeck({ roundCount: 5, choicesPerRound: 4, rng: seededRng(1) })
    expect(deck).toHaveLength(5)
    for (const round of deck) {
      expect(round.choices).toHaveLength(4)
      expect(round.choices.filter((c) => c.correct)).toHaveLength(1)
      const ids = round.choices.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('never uses a word\'s own definition as a distractor', () => {
    const deck = buildDeck({ roundCount: 6, choicesPerRound: 4, rng: seededRng(7) })
    for (const round of deck) {
      const correctText = round.choices.find((c) => c.correct)?.text
      const distractors = round.choices.filter((c) => !c.correct).map((c) => c.text)
      expect(distractors).not.toContain(correctText)
    }
  })

  it('is deterministic given the same seed and id factory', () => {
    setIdFactory((() => {
      let n = 0
      return () => `id-${(n += 1)}`
    })())
    const first = buildDeck({ roundCount: 4, rng: seededRng(42) })
    resetIdFactory()
    setIdFactory((() => {
      let n = 0
      return () => `id-${(n += 1)}`
    })())
    const second = buildDeck({ roundCount: 4, rng: seededRng(42) })
    expect(first).toEqual(second)
  })
})
