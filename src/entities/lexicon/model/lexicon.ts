import type { LexiconEntry, LexiconWord, WordCoordinate } from './types'
import { seededRng } from '@/shared/lib/random'

/**
 * Get a word by its coordinates (for the Dealer game)
 * @param lexicon - The lexicon data to search (dependency injection)
 * @param coord - The coordinates to find
 * @returns The word at the coordinates, or null if not found
 */
export function getWordByCoord(lexicon: readonly LexiconEntry[], coord: WordCoordinate): LexiconEntry | null {
  return lexicon.find(
    word => 
      word.coord?.scroll === coord.scroll &&
      word.coord?.page === coord.page &&
      word.coord?.column === coord.column &&
      word.coord?.wordNumber === coord.wordNumber
  ) || null
}

/**
 * Get random words for the Quiz game
 * @param lexicon - The lexicon data to sample from (dependency injection)
 * @param count - Number of words to return
 * @param seed - Optional seed for deterministic randomness
 * @returns Random words from the lexicon
 */
export function getRandomWords(lexicon: readonly LexiconEntry[], count: number, seed?: number): LexiconEntry[] {
  const rng = seededRng(seed !== undefined ? seed : Date.now())
  
  // Create a copy of the array to avoid modifying the original
  const shuffled = [...lexicon]
  
  // Fisher-Yates shuffle using the seeded RNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    if (j >= 0 && j < shuffled.length) {
      const temp = shuffled[i]!
      shuffled[i] = shuffled[j]!
      shuffled[j] = temp
    }
  }
  
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Get word by ID
 * @param lexicon - The lexicon data to search (dependency injection)
 * @param id - The word ID to find
 * @returns The word with the given ID, or null if not found
 */
export function getWordById(lexicon: readonly LexiconEntry[], id: string): LexiconEntry | null {
  return lexicon.find(word => word.id === id) || null
}

/**
 * Get words by scroll section
 * @param lexicon - The lexicon data to search (dependency injection)
 * @param scroll - The scroll section to filter by
 * @returns Words in the specified scroll section
 */
export function getWordsByScroll(lexicon: readonly LexiconEntry[], scroll: string): LexiconEntry[] {
  return lexicon.filter(word => word.coord?.scroll === scroll)
}

/**
 * Get lexicon statistics
 * @param lexicon - The lexicon data to analyze (dependency injection)
 * @returns Statistics about the lexicon
 */
export function getLexiconStats(lexicon: readonly LexiconEntry[]) {
  const wordsWithCoords = lexicon.filter(word => word.coord !== undefined)
  return {
    totalWords: lexicon.length,
    scrolls: [...new Set(wordsWithCoords.map(word => word.coord!.scroll))],
    maxPage: wordsWithCoords.length > 0 ? Math.max(...wordsWithCoords.map(word => word.coord!.page)) : 0,
    maxColumn: wordsWithCoords.length > 0 ? Math.max(...wordsWithCoords.map(word => word.coord!.column)) : 0,
    maxWordNumber: wordsWithCoords.length > 0 ? Math.max(...wordsWithCoords.map(word => word.coord!.wordNumber)) : 0
  }
}

/**
 * Get words for a specific language
 * Returns the localized word and definition for the requested language
 * @param lexicon - The lexicon data to search (dependency injection)
 * @param language - The language code (e.g., 'en', 'bg')
 * @returns Localized words with term, definition, and conceptId
 */
export function getWordsForLanguage(
  lexicon: readonly LexiconEntry[], 
  language: string
): { word: string; definition: string; conceptId: string; polysemy: number; difficulty: number }[] {
  return lexicon.map(entry => ({
    word: entry.translations[language] || entry.translations.en || `[Missing ${language}]`,
    definition: entry.definitions[language] || entry.definitions.en || `[Missing ${language} definition]`,
    conceptId: entry.conceptId,
    polysemy: entry.polysemy,
    difficulty: entry.difficulty
  })).filter(item => !item.word.startsWith('[Missing'))
}

/**
 * Get random words for a specific language
 * @param lexicon - The lexicon data to sample from (dependency injection)
 * @param count - Number of words to return
 * @param language - The language code (e.g., 'en', 'bg')
 * @returns Random localized words with term, definition, and conceptId
 */
export function getRandomWordsForLanguage(
  lexicon: readonly LexiconEntry[], 
  count: number, 
  language: string
): { word: string; definition: string; conceptId: string; polysemy: number; difficulty: number }[] {
  const languageWords = getWordsForLanguage(lexicon, language)
  
  // Return words in original order - let the caller handle randomization
  // This ensures deterministic behavior when combined with seeded RNG
  return languageWords.slice(0, Math.min(count, languageWords.length))
}

/**
 * Filter words by difficulty range
 * @param lexicon - The lexicon data to filter (dependency injection)
 * @param minDifficulty - Minimum difficulty (inclusive)
 * @param maxDifficulty - Maximum difficulty (inclusive)
 * @returns Words within the specified difficulty range
 */
export function filterByDifficulty(
  lexicon: readonly LexiconEntry[],
  minDifficulty: number = 1,
  maxDifficulty: number = 10
): LexiconEntry[] {
  return lexicon.filter(word => 
    word.difficulty >= minDifficulty && word.difficulty <= maxDifficulty
  )
}

/**
 * Filter words by polysemy range
 * @param lexicon - The lexicon data to filter (dependency injection)
 * @param maxPolysemy - Maximum polysemy rating (inclusive)
 * @returns Words with polysemy at or below the specified threshold
 */
export function filterByPolysemy(
  lexicon: readonly LexiconEntry[],
  maxPolysemy: number = 5
): LexiconEntry[] {
  return lexicon.filter(word => word.polysemy <= maxPolysemy)
}

/**
 * Legacy functions for backward compatibility (deprecated)
 * @deprecated Use the dependency injection versions instead
 */

/**
 * @deprecated Use getWordByCoord(lexicon, coord) instead
 */
export function getWordByCoordLegacy(_coord: WordCoordinate): LexiconWord | null {
  throw new Error('Legacy function getWordByCoordLegacy is deprecated. Use getWordByCoord(lexicon, coord) with dependency injection.')
}

/**
 * @deprecated Use getRandomWords(lexicon, count, seed) instead
 */
export function getRandomWordsLegacy(_count: number, _seed?: number): LexiconWord[] {
  throw new Error('Legacy function getRandomWordsLegacy is deprecated. Use getRandomWords(lexicon, count, seed) with dependency injection.')
}

/**
 * @deprecated Use getWordById(lexicon, id) instead
 */
export function getWordByIdLegacy(_id: string): LexiconWord | null {
  throw new Error('Legacy function getWordByIdLegacy is deprecated. Use getWordById(lexicon, id) with dependency injection.')
}

/**
 * @deprecated Use getWordsForLanguage(lexicon, language) instead
 */
export function getWordsForLanguageLegacy(_language: string): { word: string; definition: string; conceptId: string }[] {
  throw new Error('Legacy function getWordsForLanguageLegacy is deprecated. Use getWordsForLanguage(lexicon, language) with dependency injection.')
}

/**
 * @deprecated Use getRandomWordsForLanguage(lexicon, count, language) instead
 */
export function getRandomWordsForLanguageLegacy(_count: number, _language: string): { word: string; definition: string; conceptId: string }[] {
  throw new Error('Legacy function getRandomWordsForLanguageLegacy is deprecated. Use getRandomWordsForLanguage(lexicon, count, language) with dependency injection.')
}
