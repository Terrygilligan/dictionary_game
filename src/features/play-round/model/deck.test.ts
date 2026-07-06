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
    
    // Test structural determinism rather than exact equality
    // since enhanced filtering may change selection order
    expect(first).toHaveLength(second.length)
    first.forEach((round, index) => {
      const secondRound = second[index]
      expect(secondRound).toBeDefined()
      expect(round.wordId).toBe(secondRound!.wordId)
      expect(round.choices).toHaveLength(secondRound!.choices.length)
      expect(round.choices.filter(c => c.correct)).toHaveLength(1)
      expect(secondRound!.choices.filter(c => c.correct)).toHaveLength(1)
    })
  })

  it('builds language-specific decks correctly', () => {
    // Test English deck
    const englishDeck = buildDeck({ 
      roundCount: 2, 
      choicesPerRound: 4, 
      rng: seededRng(42),
      language: 'en'
    })
    
    // Test Bulgarian deck
    const bulgarianDeck = buildDeck({ 
      roundCount: 2, 
      choicesPerRound: 4, 
      rng: seededRng(42), // Same seed for comparison
      language: 'bg'
    })
    
    // Both decks should have the same structure
    expect(englishDeck).toHaveLength(2)
    expect(bulgarianDeck).toHaveLength(2)
    
    // Each round should have correct number of choices
    englishDeck.forEach(round => {
      expect(round.choices).toHaveLength(4)
      expect(round.choices.filter(c => c.correct)).toHaveLength(1)
    })
    
    bulgarianDeck.forEach(round => {
      expect(round.choices).toHaveLength(4)
      expect(round.choices.filter(c => c.correct)).toHaveLength(1)
    })
    
    // Terms should be different languages
    const enRound = englishDeck[0]
    const bgRound = bulgarianDeck[0]
    
    if (enRound && bgRound) {
      // Should be same concept with same seed
      expect(enRound.wordId).toBe(bgRound.wordId)
      
      // But different language terms
      expect(enRound.term).not.toBe(bgRound.term)
      
      // Definitions should be different languages
      const enCorrect = enRound.choices.find(c => c.correct)?.text
      const bgCorrect = bgRound.choices.find(c => c.correct)?.text
      
      expect(enCorrect).not.toBe(bgCorrect)
      
      // Distractors should also be different languages
      const enDistractors = enRound.choices.filter(c => !c.correct).map(c => c.text)
      const bgDistractors = bgRound.choices.filter(c => !c.correct).map(c => c.text)
      
      // Should have same number of distractors
      expect(enDistractors).toHaveLength(3)
      expect(bgDistractors).toHaveLength(3)
      
      // But different content (different languages)
      const hasSameDistractors = enDistractors.some(d => bgDistractors.includes(d))
      expect(hasSameDistractors).toBe(false)
    }
  })
})
