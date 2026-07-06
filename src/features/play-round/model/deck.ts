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
    const distractors = sample(
      words.filter((candidate) => candidate.conceptId !== word.conceptId),
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
