/**
 * Vocabulary Validator - Schema Enforcement Utility
 * 
 * Provides runtime validation for vocabulary entries to ensure
 * data integrity before it reaches the domain layer or event system.
 * 
 * Architectural Compliance:
 * - Pure Function: No side effects, deterministic validation
 * - Type-Safe: Works with VocabularyEntry domain model
 * - Fail-Fast: Rejects invalid data early in the pipeline
 * - Zero Dependencies: No external state or I/O
 */

import type {
  VocabularyEntry,
  ValidationResult,
  WordType,
} from '@/entities/vocabulary'

/**
 * Validate a single vocabulary entry against schema constraints
 * 
 * Enforces the following rules:
 * - All required fields must be present and non-empty
 * - ID must be valid UUID format
 * - Language code must be valid ISO 639-1 format (2-3 letters)
 * - Word type must be valid (CONCRETE or CONTEXTUAL)
 * - CONTEXTUAL words MUST provide sentence_frame
 * - Milestone ID must be positive integer
 * 
 * @param entry - The vocabulary entry to validate
 * @returns ValidationResult with validity status and error messages
 */
export function validateEntry(entry: VocabularyEntry): ValidationResult {
  const errors: string[] = []

  // Validate required fields presence
  if (!entry.id || typeof entry.id !== 'string' || entry.id.trim() === '') {
    errors.push('ID is required and must be a non-empty string')
  } else if (!isValidUUID(entry.id)) {
    errors.push(`ID must be valid UUID format, received: ${entry.id}`)
  }

  if (!entry.language || typeof entry.language !== 'string' || entry.language.trim() === '') {
    errors.push('Language is required and must be a non-empty string')
  } else if (!isValidLanguageCode(entry.language)) {
    errors.push(`Language must be valid ISO 639-1 code (2-3 letters), received: ${entry.language}`)
  }

  if (!entry.word || typeof entry.word !== 'string' || entry.word.trim() === '') {
    errors.push('Word is required and must be a non-empty string')
  }

  if (!entry.word_type || !isValidWordType(entry.word_type)) {
    errors.push(`Word type must be 'CONCRETE' or 'CONTEXTUAL', received: ${entry.word_type}`)
  }

  // Validate definition structure
  if (!entry.definition || typeof entry.definition !== 'object') {
    errors.push('Definition is required and must be an object')
  } else {
    if (!entry.definition.short || typeof entry.definition.short !== 'string' || entry.definition.short.trim() === '') {
      errors.push('Definition.short is required and must be a non-empty string')
    }
    if (!entry.definition.long || typeof entry.definition.long !== 'string' || entry.definition.long.trim() === '') {
      errors.push('Definition.long is required and must be a non-empty string')
    }
  }

  // Validate CONTEXTUAL word requirement
  if (entry.word_type === 'CONTEXTUAL') {
    if (!entry.sentence_frame || typeof entry.sentence_frame !== 'string' || entry.sentence_frame.trim() === '') {
      errors.push('sentence_frame is required for CONTEXTUAL word types')
    }
  }

  // Validate semantic group
  if (!entry.semantic_group || typeof entry.semantic_group !== 'string' || entry.semantic_group.trim() === '') {
    errors.push('Semantic group is required and must be a non-empty string')
  }

  // Validate milestone ID
  if (typeof entry.milestone_id !== 'number' || entry.milestone_id < 1) {
    errors.push('Milestone ID must be a positive integer (>= 1)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate a complete vocabulary manifest
 * 
 * @param manifest - The vocabulary manifest to validate
 * @returns ValidationResult with validity status and error messages
 */
export function validateManifest(manifest: {
  readonly entries: readonly VocabularyEntry[]
}): ValidationResult {
  const errors: string[] = []

  if (!manifest.entries || !Array.isArray(manifest.entries)) {
    errors.push('Manifest must contain an entries array')
    return { valid: false, errors }
  }

  if (manifest.entries.length === 0) {
    errors.push('Manifest must contain at least one entry')
  }

  // Validate each entry
  manifest.entries.forEach((entry, index) => {
    const entryResult = validateEntry(entry)
    if (!entryResult.valid) {
      errors.push(`Entry at index ${index} (${entry.id || 'unknown'}): ${entryResult.errors.join(', ')}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if a string is a valid UUID format
 * 
 * @param id - The string to check
 * @returns True if valid UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Check if a string is a valid ISO 639-1 language code
 * 
 * @param code - The language code to check
 * @returns True if valid language code
 */
function isValidLanguageCode(code: string): boolean {
  const languageCodeRegex = /^[a-z]{2,3}$/i
  return languageCodeRegex.test(code)
}

/**
 * Check if a value is a valid WordType
 * 
 * @param type - The value to check
 * @returns True if valid WordType
 */
function isValidWordType(type: unknown): type is WordType {
  return type === 'CONCRETE' || type === 'CONTEXTUAL'
}
