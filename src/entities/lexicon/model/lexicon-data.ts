import type { LexiconWord } from './types'

/**
 * Migration helper to convert existing flat English lexicon data
 * to the new multi-language concept-based structure.
 * 
 * This function maps existing English words to the new format,
 * placing English data in the 'en' language keys.
 */

export interface LegacyLexiconWord {
  id: string
  word: string
  definition: string
  coord: {
    scroll: string
    page: number
    column: number
    wordNumber: number
  }
}

export function migrateToMultiLanguageFormat(
  legacyData: LegacyLexiconWord[]
): LexiconWord[] {
  return legacyData.map((word, index) => ({
    id: word.id,
    conceptId: `concept_${(index + 1).toString().padStart(3, '0')}`,
    translations: {
      en: word.word
    },
    definitions: {
      en: word.definition
    },
    coord: word.coord
  }))
}

/**
 * Sample Bulgarian translations to demonstrate the multi-language structure.
 * In production, this would come from a proper translation source.
 */
export const sampleBulgarianTranslations = {
  concept_001: {
    word: "аберация",
    definition: "отклонение от това, което е нормално, обичайно или очаквано, обикновено нежелано"
  },
  concept_002: {
    word: "отвращавам",
    definition: "преглеждам с отвращение и омраза"
  },
  concept_003: {
    word: "присъщ",
    definition: "съществуващ или присъстващ в нещо като естествена, постоянна или характерна черта"
  }
}

/**
 * Function to add Bulgarian translations to existing English lexicon
 */
export function addBulgarianTranslations(
  englishLexicon: LexiconWord[]
): LexiconWord[] {
  return englishLexicon.map(word => {
    const bulgarianTranslation = sampleBulgarianTranslations[word.conceptId as keyof typeof sampleBulgarianTranslations]
    
    if (bulgarianTranslation) {
      return {
        ...word,
        translations: {
          ...word.translations,
          bg: bulgarianTranslation.word
        },
        definitions: {
          ...word.definitions,
          bg: bulgarianTranslation.definition
        }
      }
    }
    
    return word
  })
}

/**
 * Utility function to get words for a specific language
 */
export function getWordsForLanguage(
  lexicon: LexiconWord[], 
  language: string
): { word: string; definition: string; conceptId: string }[] {
  return lexicon.map(entry => ({
    word: entry.translations[language] || entry.translations.en || `[Missing ${language}]`,
    definition: entry.definitions[language] || entry.definitions.en || `[Missing ${language} definition]`,
    conceptId: entry.conceptId
  })).filter(item => !item.word.startsWith('[Missing'))
}
