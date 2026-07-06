import { getRandomWordsForLanguage } from '@/entities/lexicon'
import type { Choice, RoundSpec } from '@/entities/game'
import { nextId, sample, shuffle, type Rng } from '@/shared/lib'

export interface DeckOptions {
  roundCount?: number
  choicesPerRound?: number
  rng?: Rng
  seed?: number
  language?: string
}

/**
 * Builds a shuffled deck of rounds. This is the only impure part of starting a
 * game (randomness); the resulting deck is passed into the `startGame` command
 * so the event log remains a deterministic record.
 */
export function buildDeck(options: DeckOptions = {}): RoundSpec[] {
  const { roundCount = 8, choicesPerRound = 4, rng = Math.random, seed, language = 'en' } = options

  // Get random words for the specified language
  const words = getRandomWordsForLanguage(roundCount + (choicesPerRound - 1) * roundCount, language, seed)

  // Select prompt words
  const prompts = sample(words, roundCount, rng)

  return prompts.map((word) => {
    // Enhanced filtering: Target Exclusion, Content Uniqueness, and Redundancy filtering
    // First apply basic conceptId filtering to maintain determinism
    // Use the same filtering order as the original to maintain determinism
    const basicDistractorPool = words.filter((candidate) => candidate.conceptId !== word.conceptId)
    
    // Then apply strict filtering for distractor selection (only if we have enough candidates)
    let strictDistractorPool = basicDistractorPool
    if (basicDistractorPool.length >= choicesPerRound - 1) {
      strictDistractorPool = basicDistractorPool.filter((candidate) => {
        // 1. Content Uniqueness: Filter out exact definition matches
        if (candidate.definition === word.definition) {
          return false
        }
        
        // 2. Redundancy Filtering: Filter out semantically similar content
        const targetDef = word.definition.toLowerCase()
        const candidateDef = candidate.definition.toLowerCase()
        const targetWord = word.word.toLowerCase()
        const candidateWord = candidate.word.toLowerCase()
        
        // Filter out if target word appears in distractor definition
        if (candidateDef.includes(targetWord)) {
          return false
        }
        
        // Filter out if distractor word appears in target definition  
        if (targetDef.includes(candidateWord)) {
          return false
        }
        
        // Filter out if definitions are very similar (one is substring of other)
        if (targetDef.includes(candidateDef) || candidateDef.includes(targetDef)) {
          return false
        }
        
        // Filter out if definitions share significant word overlap (>50% same words)
        const targetWords = targetDef.split(/\s+/).filter(w => w.length > 2) // ignore short words
        const candidateWords = candidateDef.split(/\s+/).filter(w => w.length > 2)
        
        if (targetWords.length > 0 && candidateWords.length > 0) {
          const commonWords = targetWords.filter(tw => candidateWords.includes(tw))
          const overlapRatio = commonWords.length / Math.min(targetWords.length, candidateWords.length)
          
          if (overlapRatio > 0.5) {
            return false
          }
        }
        
        return true
      })
    }
    
    // Try to use strict pool first, fallback to basic if insufficient
    let finalDistractorPool = strictDistractorPool
    
    if (strictDistractorPool.length < choicesPerRound - 1) {
      finalDistractorPool = basicDistractorPool
    }
    
    const distractors = sample(
      finalDistractorPool,
      choicesPerRound - 1,
      rng,
    )

    const choices: Choice[] = shuffle(
      [
        { id: nextId(), text: word.definition, correct: true },
        ...distractors.map((d) => ({ id: nextId(), text: d.definition, correct: false })),
      ],
      rng,
    )

    return {
      wordId: word.conceptId, // Use conceptId instead of word.id
      term: word.word,
      partOfSpeech: 'noun', // Default part of speech - could be enhanced in lexicon schema
      choices,
    }
  })
}
