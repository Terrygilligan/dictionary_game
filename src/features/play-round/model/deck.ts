import { WORDS, type Word } from '@/entities/word'
import type { Choice, RoundSpec } from '@/entities/game'
import { nextId, sample, shuffle, type Rng } from '@/shared/lib'

export interface DeckOptions {
  roundCount?: number
  choicesPerRound?: number
  rng?: Rng
  words?: readonly Word[]
}

/**
 * Builds a shuffled deck of rounds. This is the only impure part of starting a
 * game (randomness); the resulting deck is passed into the `startGame` command
 * so the event log remains a deterministic record.
 */
export function buildDeck(options: DeckOptions = {}): RoundSpec[] {
  const { roundCount = 8, choicesPerRound = 4, rng = Math.random, words = WORDS } = options

  const prompts = sample(words, roundCount, rng)

  return prompts.map((word) => {
    const distractors = sample(
      words.filter((candidate) => candidate.id !== word.id),
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
      wordId: word.id,
      term: word.term,
      partOfSpeech: word.partOfSpeech,
      choices,
    }
  })
}
