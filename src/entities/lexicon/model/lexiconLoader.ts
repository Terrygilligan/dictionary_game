import type { LexiconEntry, LexiconWord } from './types'

/**
 * Load and validate the master lexicon data
 * This function should be called from the edge layer (feature layer, not domain models)
 * @returns Promise resolving to validated lexicon entries
 */
export async function loadMasterLexicon(): Promise<LexiconEntry[]> {
  try {
    // Dynamic import to avoid module-level side effects
    const lexiconModule = await import('../data/master-lexicon.json')
    const rawData = lexiconModule.default as unknown[]
    
    // Validate and transform to unified schema
    const validation = validateLexiconData(rawData)
    if (!validation.isValid) {
      throw new Error(`Invalid lexicon data: ${validation.errors.join(', ')}`)
    }
    
    // Warn about any validation warnings
    if (validation.warnings.length > 0) {
      console.warn('Lexicon validation warnings:', validation.warnings)
    }
    
    return rawData as LexiconEntry[]
  } catch (error) {
    throw new Error(`Failed to load master lexicon: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Validate lexicon data against unified schema requirements
 * Validates both legacy LexiconWord and new LexiconEntry formats
 */
export function validateLexiconData(lexicon: unknown[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  const requiredLanguages = ['en', 'bg']
  
  if (!Array.isArray(lexicon)) {
    return {
      isValid: false,
      errors: ['Lexicon data must be an array'],
      warnings: []
    }
  }
  
  lexicon.forEach((word, index) => {
    if (typeof word !== 'object' || word === null) {
      errors.push(`Entry ${index + 1}: Not an object`)
      return
    }
    
    const entry = word as Record<string, unknown>
    
    // Check required fields for unified schema
    if (!entry.id || typeof entry.id !== 'string') {
      errors.push(`Entry ${index + 1}: Missing or invalid id`)
    }
    
    if (!entry.conceptId || typeof entry.conceptId !== 'string') {
      errors.push(`Entry ${index + 1}: Missing or invalid conceptId`)
    }
    
    // Check translations
    if (!entry.translations || typeof entry.translations !== 'object') {
      errors.push(`Entry ${index + 1}: Missing or invalid translations`)
    } else {
      requiredLanguages.forEach(lang => {
        const translations = entry.translations as Record<string, unknown>
        if (!translations[lang] || typeof translations[lang] !== 'string') {
          warnings.push(`Entry ${index + 1} (${entry.conceptId}): Missing translation for '${lang}'`)
        }
      })
    }
    
    // Check definitions
    if (!entry.definitions || typeof entry.definitions !== 'object') {
      errors.push(`Entry ${index + 1}: Missing or invalid definitions`)
    } else {
      requiredLanguages.forEach(lang => {
        const definitions = entry.definitions as Record<string, unknown>
        if (!definitions[lang] || typeof definitions[lang] !== 'string') {
          warnings.push(`Entry ${index + 1} (${entry.conceptId}): Missing definition for '${lang}'`)
        }
      })
    }
    
    // Check new unified schema fields
    if (entry.polysemy === undefined) {
      errors.push(`Entry ${index + 1} (${entry.conceptId}): Missing required field 'polysemy'`)
    } else if (typeof entry.polysemy !== 'number' || entry.polysemy < 1 || entry.polysemy > 5) {
      errors.push(`Entry ${index + 1} (${entry.conceptId}): Invalid polysemy value (must be 1-5)`)
    }
    
    if (entry.difficulty === undefined) {
      errors.push(`Entry ${index + 1} (${entry.conceptId}): Missing required field 'difficulty'`)
    } else if (typeof entry.difficulty !== 'number' || entry.difficulty < 1 || entry.difficulty > 10) {
      errors.push(`Entry ${index + 1} (${entry.conceptId}): Invalid difficulty value (must be 1-10)`)
    }
    
    // Check coordinates (optional for unified schema, but validate if present)
    if (entry.coord !== undefined) {
      if (typeof entry.coord !== 'object' || entry.coord === null) {
        errors.push(`Entry ${index + 1}: Invalid coord (must be object)`)
      } else {
        const coord = entry.coord as Record<string, unknown>
        if (!coord.scroll || typeof coord.scroll !== 'string') {
          errors.push(`Entry ${index + 1}: Missing or invalid scroll coordinate`)
        }
        if (typeof coord.page !== 'number') {
          errors.push(`Entry ${index + 1}: Invalid page coordinate`)
        }
        if (typeof coord.column !== 'number') {
          errors.push(`Entry ${index + 1}: Invalid column coordinate`)
        }
        if (typeof coord.wordNumber !== 'number') {
          errors.push(`Entry ${index + 1}: Invalid wordNumber coordinate`)
        }
      }
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Legacy load function for backward compatibility (deprecated)
 * @deprecated Use loadMasterLexicon() async function instead
 */
export function loadMasterLexiconSync(): LexiconWord[] {
  throw new Error('Legacy function loadMasterLexiconSync is deprecated. Use loadMasterLexicon() async function instead.')
}
