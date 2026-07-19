/**
 * Vocabulary Entity Decider
 * 
 * Pure domain logic that validates commands and produces events.
 * No I/O, no randomness, no side effects - deterministic command validation.
 * 
 * Architectural Compliance:
 * - Pure Domain Logic: Deterministic validation, no external dependencies
 * - Event-Sourced: Returns events for valid commands, empty array for invalid
 * - Command Identity: Requires tenant_id and aggregate_id in all commands
 * - Multi-Tenant: All operations scoped by tenant_id
 */

import type { VocabularyCommand, AddWordDefinition, BulkAddWordDefinitions } from './commands.js'
import type { VocabularyEvent, WordDefinitionAdded, BulkWordDefinitionsAdded, WordDefinitionValidationFailed } from './events.js'
import { validateEntry } from '../../../shared/lib/vocabulary/validator.js'

/**
 * Vocabulary State (placeholder for future state management)
 * 
 * Currently vocabulary is primarily projection-based, but state structure
 * is defined for future domain logic requirements.
 */
export interface VocabularyState {
  readonly wordIds: readonly string[]
  readonly lastUpdated: number
}

/**
 * Initial vocabulary state
 */
export const initialVocabularyState: VocabularyState = {
  wordIds: [],
  lastUpdated: 0,
}

/**
 * Decide function for vocabulary commands
 * 
 * Validates commands and returns appropriate events.
 * Invalid commands return empty array (no events produced).
 * 
 * @param state - Current vocabulary state
 * @param command - The command to process
 * @returns Array of events (empty if command is invalid)
 */
export function decideVocabulary(
  state: VocabularyState,
  command: VocabularyCommand
): VocabularyEvent[] {
  switch (command.type) {
    case 'vocabulary/addWordDefinition':
      return handleAddWordDefinition(state, command)
    
    case 'vocabulary/bulkAddWordDefinitions':
      return handleBulkAddWordDefinitions(state, command)
    
    default:
      // Unknown command type - return no events
      return []
  }
}

/**
 * Handle addWordDefinition command
 * 
 * Validates the vocabulary entry and emits appropriate events.
 * 
 * @param state - Current vocabulary state
 * @param command - The addWordDefinition command
 * @returns Array of events (WordDefinitionAdded or WordDefinitionValidationFailed)
 */
function handleAddWordDefinition(
  state: VocabularyState,
  command: AddWordDefinition
): VocabularyEvent[] {
  const { tenant_id, aggregate_id, entry } = command

  // Validate the entry using our validator
  const validationResult = validateEntry(entry)
  
  if (!validationResult.valid) {
    // Return validation failed event
    const validationFailedEvent: WordDefinitionValidationFailed = {
      tenant_id,
      aggregate_id,
      type: 'vocabulary/wordDefinitionValidationFailed',
      wordId: entry.id,
      errors: validationResult.errors,
      failedAt: Date.now(),
    }
    return [validationFailedEvent]
  }

  // Check for duplicates (idempotency)
  if (state.wordIds.includes(entry.id)) {
    // Word already exists - return no events (idempotent)
    return []
  }

  // Entry is valid and doesn't exist - emit success event
  const wordAddedEvent: WordDefinitionAdded = {
    tenant_id,
    aggregate_id,
    type: 'vocabulary/wordDefinitionAdded',
    wordId: entry.id,
    entry,
    addedAt: Date.now(),
  }

  return [wordAddedEvent]
}

/**
 * Handle bulkAddWordDefinitions command
 * 
 * Processes multiple vocabulary entries in a single operation.
 * Each entry is validated individually; failures don't abort the entire batch.
 * 
 * @param state - Current vocabulary state
 * @param command - The bulkAddWordDefinitions command
 * @returns Array of events (mixed success and validation failed events)
 */
function handleBulkAddWordDefinitions(
  state: VocabularyState,
  command: BulkAddWordDefinitions
): VocabularyEvent[] {
  const { tenant_id, aggregate_id, entries } = command
  const events: VocabularyEvent[] = []
  const successfulWordIds: string[] = []

  for (const entry of entries) {
    // Validate each entry
    const validationResult = validateEntry(entry)
    
    if (!validationResult.valid) {
      // Emit validation failed event for this entry
      const validationFailedEvent: WordDefinitionValidationFailed = {
        tenant_id,
        aggregate_id,
        type: 'vocabulary/wordDefinitionValidationFailed',
        wordId: entry.id,
        errors: validationResult.errors,
        failedAt: Date.now(),
      }
      events.push(validationFailedEvent)
      continue
    }

    // Check for duplicates
    if (state.wordIds.includes(entry.id)) {
      // Skip duplicates (idempotent)
      continue
    }

    // Entry is valid and doesn't exist - emit success event
    const wordAddedEvent: WordDefinitionAdded = {
      tenant_id,
      aggregate_id,
      type: 'vocabulary/wordDefinitionAdded',
      wordId: entry.id,
      entry,
      addedAt: Date.now(),
    }
    events.push(wordAddedEvent)
    successfulWordIds.push(entry.id)
  }

  // Emit bulk completion event if there were any successful additions
  if (successfulWordIds.length > 0) {
    const bulkAddedEvent: BulkWordDefinitionsAdded = {
      tenant_id,
      aggregate_id,
      type: 'vocabulary/bulkWordDefinitionsAdded',
      wordIds: successfulWordIds,
      count: successfulWordIds.length,
      addedAt: Date.now(),
    }
    events.push(bulkAddedEvent)
  }

  return events
}
