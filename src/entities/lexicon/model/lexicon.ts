import type { LexiconWord, WordCoordinate } from './types'
import { seededRng } from '@/shared/lib/random'
import { loadMasterLexicon } from './lexiconLoader'

// Load and validate master lexicon data
const lexiconWords: LexiconWord[] = loadMasterLexicon()

/**
 * Get a word by its coordinates (for the Dealer game)
 */
export function getWordByCoord(coord: WordCoordinate): LexiconWord | null {
  return lexiconWords.find(
    word => 
      word.coord.scroll === coord.scroll &&
      word.coord.page === coord.page &&
      word.coord.column === coord.column &&
      word.coord.wordNumber === coord.wordNumber
  ) || null
}

/**
 * Get random words for the Quiz game
 */
export function getRandomWords(count: number, seed?: number): LexiconWord[] {
  const rng = seededRng(seed || Date.now())
  
  // Create a copy of the array to avoid modifying the original
  const shuffled = [...lexiconWords]
  
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
 * Get all words (useful for testing or full dataset access)
 */
export function getAllWords(): LexiconWord[] {
  return [...lexiconWords]
}

/**
 * Get word by ID
 */
export function getWordById(id: string): LexiconWord | null {
  return lexiconWords.find(word => word.id === id) || null
}

/**
 * Get words by scroll section
 */
export function getWordsByScroll(scroll: string): LexiconWord[] {
  return lexiconWords.filter(word => word.coord.scroll === scroll)
}

/**
 * Get lexicon statistics
 */
export function getLexiconStats() {
  return {
    totalWords: lexiconWords.length,
    scrolls: [...new Set(lexiconWords.map(word => word.coord.scroll))],
    maxPage: Math.max(...lexiconWords.map(word => word.coord.page)),
    maxColumn: Math.max(...lexiconWords.map(word => word.coord.column)),
    maxWordNumber: Math.max(...lexiconWords.map(word => word.coord.wordNumber))
  }
}

/**
 * Get words for a specific language
 * Returns the localized word and definition for the requested language
 */
export function getWordsForLanguage(language: string): { word: string; definition: string; conceptId: string }[] {
  return lexiconWords.map(entry => ({
    word: entry.translations[language] || entry.translations.en || `[Missing ${language}]`,
    definition: entry.definitions[language] || entry.definitions.en || `[Missing ${language} definition]`,
    conceptId: entry.conceptId
  })).filter(item => !item.word.startsWith('[Missing'))
}

/**
 * Get random words for a specific language
 */
export function getRandomWordsForLanguage(count: number, language: string, seed?: number): { word: string; definition: string; conceptId: string }[] {
  const languageWords = getWordsForLanguage(language)
  const rng = seededRng(seed || Date.now())
  
  // Create a copy of the array to avoid modifying the original
  const shuffled = [...languageWords]
  
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
