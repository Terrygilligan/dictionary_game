import { i18nService } from '@/shared/lib/i18n/i18nService'
import type { LexiconWord, WordCoordinate } from './types'
import { getWordById, getAllWords } from './lexicon'
import { seededRng } from '@/shared/lib/random'

/**
 * Localized word interface that extends the base LexiconWord
 * with translation support
 */
export interface LocalizedLexiconWord extends LexiconWord {
  localizedWord: string
  localizedDefinition: string
}

/**
 * Word translation mapping structure
 * Maps word IDs to translations in different languages
 */
export interface WordTranslation {
  word: string
  definition: string
  contributor?: string
}

export interface WordTranslations {
  [language: string]: WordTranslation
}

/**
 * Word translation registry
 * This would typically be loaded from external JSON files or API
 * For now, we'll create a sample structure
 */
const wordTranslationRegistry = new Map<string, WordTranslations>()

/**
 * Register word translations for all supported languages
 * This function would typically load translation data from JSON files
 */
export function registerWordTranslations(wordId: string, translations: WordTranslations): void {
  wordTranslationRegistry.set(wordId, translations)
}

/**
 * Get localized word by ID
 * Resolves word ID to localized content based on current language
 */
export function getLocalizedWordById(wordId: string): LocalizedLexiconWord | null {
  const baseWord = getWordById(wordId)
  if (!baseWord) {
    return null
  }

  const currentLanguage = i18nService.getCurrentLanguage()
  const translations = wordTranslationRegistry.get(wordId)
  
  const firstLang = Object.keys(baseWord.translations)[0]
  const firstDefLang = Object.keys(baseWord.definitions)[0]
  let localizedWord = baseWord.translations.en || (firstLang ? baseWord.translations[firstLang] : '') || ''
  let localizedDefinition = baseWord.definitions.en || (firstDefLang ? baseWord.definitions[firstDefLang] : '') || ''

  // Apply translations if available for current language
  if (translations && translations[currentLanguage]) {
    localizedWord = translations[currentLanguage].word
    localizedDefinition = translations[currentLanguage].definition
  } else if (translations && translations['en']) {
    // Fallback to English if current language not available
    localizedWord = translations['en'].word
    localizedDefinition = translations['en'].definition
  }

  return {
    ...baseWord,
    localizedWord,
    localizedDefinition,
  }
}

/**
 * Get multiple localized words by IDs
 */
export function getLocalizedWordsByIds(wordIds: string[]): LocalizedLexiconWord[] {
  return wordIds
    .map(id => getLocalizedWordById(id))
    .filter((word): word is LocalizedLexiconWord => word !== null)
}

/**
 * Get localized word by coordinates
 */
export function getLocalizedWordByCoord(coord: WordCoordinate): LocalizedLexiconWord | null {
  const baseWord = getAllWords().find(
    word => 
      word.coord.scroll === coord.scroll &&
      word.coord.page === coord.page &&
      word.coord.column === coord.column &&
      word.coord.wordNumber === coord.wordNumber
  )

  if (!baseWord) {
    return null
  }

  return getLocalizedWordById(baseWord.id)
}

/**
 * Get random localized words for quiz games
 */
export function getRandomLocalizedWords(count: number, seed?: number): LocalizedLexiconWord[] {
  const allWords = getAllWords()
  const rng = seed ? seededRng(seed) : Math.random
  
  // Use the existing shuffle function from the random lib
  const shuffled = [...allWords].sort(() => rng() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))
  
  // Localize the selected words
  return selected.map(word => getLocalizedWordById(word.id)!).filter(Boolean)
}

/**
 * Initialize word translations from locale data
 * This would typically load from JSON files containing word translations
 */
export async function initializeWordTranslations(): Promise<void> {
  try {
    // For demonstration, we'll create some sample translations
    // In a real implementation, this would load from JSON files
    
    // Sample translations for a few words
    registerWordTranslations('word_001', {
      en: { word: 'aberration', definition: 'a departure from what is normal, usual, or expected, typically one that is unwelcome' },
      nl: { word: 'afwijking', definition: 'een afwijking van wat normaal, gebruikelijk of verwacht wordt, meestal iets ongewenst' },
      fr: { word: 'aberration', definition: 'une déviation de ce qui est normal, habituel ou attendu, généralement quelque chose d\'indésirable' },
      de: { word: 'Aberration', definition: 'eine Abweichung von dem, was normal, üblich oder erwartet wird, typischerweise etwas Unerwünschtes' },
    })

    registerWordTranslations('word_002', {
      en: { word: 'abhor', definition: 'regard with disgust and hatred' },
      nl: { word: 'haten', definition: 'met walging en haat bekijken' },
      fr: { word: 'abhorrer', definition: 'regarder avec dégoût et haine' },
      de: { word: 'verabscheuen', definition: 'mit Ekel und Hass betrachten' },
    })

    registerWordTranslations('word_003', {
      en: { word: 'abide', definition: 'accept or act in accordance with (a rule, decision, or recommendation)' },
      nl: { word: 'zich houden aan', definition: 'accepteren of handelen in overeenstemming met (een regel, beslissing of aanbeveling)' },
      fr: { word: 'respecter', definition: 'accepter ou agir conformément (à une règle, décision ou recommandation)' },
      de: { word: 'einhalten', definition: 'akzeptieren oder entsprechend handeln (einer Regel, Entscheidung oder Empfehlung)' },
    })

    console.log('Word translations initialized')
  } catch (error) {
    console.error('Failed to initialize word translations:', error)
  }
}

/**
 * Get available translation languages for a word
 */
export function getAvailableTranslationLanguages(wordId: string): string[] {
  const translations = wordTranslationRegistry.get(wordId)
  return translations ? Object.keys(translations) : []
}

/**
 * Check if a word has translations for the current language
 */
export function hasTranslationForCurrentLanguage(wordId: string): boolean {
  const translations = wordTranslationRegistry.get(wordId)
  const currentLanguage = i18nService.getCurrentLanguage()
  return !!(translations && translations[currentLanguage])
}

/**
 * Get word contributor information (for community-contributed translations)
 */
export function getWordContributor(wordId: string, language: string): string | undefined {
  const translations = wordTranslationRegistry.get(wordId)
  return translations?.[language]?.contributor
}
