import type { Word } from './types.ts'

/**
 * A small, self-contained lexicon. Kept in-repo (no network dependency) to
 * honour the "minimal dependencies" standard. Definitions are original,
 * concise paraphrases suitable for a multiple-choice quiz.
 */
export const WORDS: readonly Word[] = [
  {
    id: 'ephemeral',
    term: 'ephemeral',
    partOfSpeech: 'adjective',
    definition: 'lasting for only a very short time',
  },
  {
    id: 'ubiquitous',
    term: 'ubiquitous',
    partOfSpeech: 'adjective',
    definition: 'present, appearing, or found everywhere',
  },
  {
    id: 'gregarious',
    term: 'gregarious',
    partOfSpeech: 'adjective',
    definition: 'fond of the company of others; sociable',
  },
  {
    id: 'quell',
    term: 'quell',
    partOfSpeech: 'verb',
    definition: 'to put an end to, typically by force',
  },
  {
    id: 'candor',
    term: 'candor',
    partOfSpeech: 'noun',
    definition: 'the quality of being open and honest in expression',
  },
  {
    id: 'lucid',
    term: 'lucid',
    partOfSpeech: 'adjective',
    definition: 'expressed clearly and easy to understand',
  },
  {
    id: 'meticulous',
    term: 'meticulous',
    partOfSpeech: 'adjective',
    definition: 'showing great attention to detail; very careful',
  },
  {
    id: 'placate',
    term: 'placate',
    partOfSpeech: 'verb',
    definition: 'to make someone less angry or hostile',
  },
  {
    id: 'tenacious',
    term: 'tenacious',
    partOfSpeech: 'adjective',
    definition: 'holding firmly to a purpose; persistent',
  },
  {
    id: 'zenith',
    term: 'zenith',
    partOfSpeech: 'noun',
    definition: 'the highest point reached; the peak',
  },
  {
    id: 'wane',
    term: 'wane',
    partOfSpeech: 'verb',
    definition: 'to decrease gradually in size, strength, or extent',
  },
  {
    id: 'prudent',
    term: 'prudent',
    partOfSpeech: 'adjective',
    definition: 'acting with care and thought for the future',
  },
  {
    id: 'garrulous',
    term: 'garrulous',
    partOfSpeech: 'adjective',
    definition: 'excessively talkative, especially about trivial matters',
  },
  {
    id: 'abate',
    term: 'abate',
    partOfSpeech: 'verb',
    definition: 'to become less intense or widespread',
  },
  {
    id: 'nuance',
    term: 'nuance',
    partOfSpeech: 'noun',
    definition: 'a subtle difference in meaning, expression, or sound',
  },
  {
    id: 'resilient',
    term: 'resilient',
    partOfSpeech: 'adjective',
    definition: 'able to recover quickly from difficult conditions',
  },
]
