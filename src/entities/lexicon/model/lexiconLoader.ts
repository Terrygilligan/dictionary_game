import type { LexiconWord } from './types'
// @ts-ignore - JSON import
import masterLexiconRaw from '../data/master-lexicon.json'

/**
 * Load and validate the master lexicon data
 */
export function loadMasterLexicon(): LexiconWord[] {
  return masterLexiconRaw as LexiconWord[]
}

/**
 * Validate that all concepts have required language fields
 */
export function validateLexiconData(lexicon: LexiconWord[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const requiredLanguages = ['en', 'bg']
  
  lexicon.forEach((word, index) => {
    // Check conceptId
    if (!word.conceptId) {
      errors.push(`Entry ${index + 1}: Missing conceptId`)
    }
    
    // Check translations
    requiredLanguages.forEach(lang => {
      if (!word.translations[lang]) {
        warnings.push(`Entry ${index + 1} (${word.conceptId}): Missing translation for '${lang}'`)
      }
    })
    
    // Check definitions
    requiredLanguages.forEach(lang => {
      if (!word.definitions[lang]) {
        warnings.push(`Entry ${index + 1} (${word.conceptId}): Missing definition for '${lang}'`)
      }
    })
    
    // Check coordinates
    if (!word.coord) {
      errors.push(`Entry ${index + 1} (${word.conceptId}): Missing coordinates`)
    } else {
      if (!word.coord.scroll) errors.push(`Entry ${index + 1}: Missing scroll coordinate`)
      if (typeof word.coord.page !== 'number') errors.push(`Entry ${index + 1}: Invalid page coordinate`)
      if (typeof word.coord.column !== 'number') errors.push(`Entry ${index + 1}: Invalid column coordinate`)
      if (typeof word.coord.wordNumber !== 'number') errors.push(`Entry ${index + 1}: Invalid wordNumber coordinate`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}
