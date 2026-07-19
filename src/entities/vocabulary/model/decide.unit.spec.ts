/**
 * Pure Unit Tests for Vocabulary Decider
 * 
 * Tests the decideVocabulary function in isolation without:
 * - Firebase initialization
 * - Network calls
 * - External dependencies
 * - Side effects
 * 
 * Uses deterministic timestamp via context parameter for pure testing.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { decideVocabulary, initialVocabularyState, type DeciderContext } from './decide'
import type { VocabularyEntry } from './types'
import type { AddWordDefinition } from './commands'

// Deterministic timestamp for testing
const DETERMINISTIC_TIMESTAMP = 1721380000000
const testContext: DeciderContext = { timestamp: DETERMINISTIC_TIMESTAMP }

describe('Vocabulary Decider - Pure Unit Tests', () => {
  beforeEach(() => {
    // No setup needed - tests are pure and deterministic
  })

  describe('addWordDefinition command', () => {
    const validEntry: VocabularyEntry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      language: 'en',
      word: 'test',
      word_type: 'CONCRETE',
      definition: {
        short: 'A short definition',
        long: 'A longer, more detailed definition',
      },
      semantic_group: 'test-group',
      milestone_id: 1,
    }

    const baseCommand: Omit<AddWordDefinition, 'type' | 'entry'> = {
      tenant_id: 'tenant-123',
      aggregate_id: 'aggregate-456',
    }

    it('should emit WordDefinitionAdded event for valid entry', () => {
      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: validEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        type: 'vocabulary/wordDefinitionAdded',
        tenant_id: 'tenant-123',
        aggregate_id: 'aggregate-456',
        wordId: validEntry.id,
        entry: validEntry,
        addedAt: DETERMINISTIC_TIMESTAMP,
      })
    })

    it('should return empty array for duplicate entry (idempotency)', () => {
      const stateWithWord = {
        ...initialVocabularyState,
        wordIds: [validEntry.id],
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: validEntry,
      }

      const events = decideVocabulary(stateWithWord, command, testContext)

      expect(events).toHaveLength(0)
    })

    it('should emit validation failed event for invalid UUID', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry,
        id: 'not-a-uuid',
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: invalidEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      const event = events[0]!
      if (event.type === 'vocabulary/wordDefinitionValidationFailed') {
        expect(event).toMatchObject({
          type: 'vocabulary/wordDefinitionValidationFailed',
          tenant_id: 'tenant-123',
          aggregate_id: 'aggregate-456',
          wordId: invalidEntry.id,
          failedAt: DETERMINISTIC_TIMESTAMP,
        })
        expect(event.errors.length).toBeGreaterThan(0)
        expect(event.errors.some((e: string) => e.includes('UUID'))).toBe(true)
      } else {
        throw new Error('Expected validation failed event')
      }
    })

    it('should emit validation failed event for missing required fields', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry,
        word: '', // Missing word
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: invalidEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      const event = events[0]!
      if (event.type === 'vocabulary/wordDefinitionValidationFailed') {
        expect(event.type).toBe('vocabulary/wordDefinitionValidationFailed')
        expect(event.errors.some((e: string) => e.includes('Word'))).toBe(true)
      } else {
        throw new Error('Expected validation failed event')
      }
    })

    it('should emit validation failed event for CONTEXTUAL word without sentence_frame', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry,
        word_type: 'CONTEXTUAL',
        // sentence_frame is missing
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: invalidEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      const event = events[0]!
      if (event.type === 'vocabulary/wordDefinitionValidationFailed') {
        expect(event.type).toBe('vocabulary/wordDefinitionValidationFailed')
        expect(event.errors.some((e: string) => e.includes('sentence_frame'))).toBe(true)
      } else {
        throw new Error('Expected validation failed event')
      }
    })

    it('should accept CONTEXTUAL word with sentence_frame', () => {
      const contextualEntry: VocabularyEntry = {
        ...validEntry,
        word_type: 'CONTEXTUAL',
        sentence_frame: 'This is a sentence frame for the word.',
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: contextualEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      expect(events[0]!.type).toBe('vocabulary/wordDefinitionAdded')
    })

    it('should emit validation failed event for invalid language code', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry,
        language: 'INVALID',
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: invalidEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      const event = events[0]!
      if (event.type === 'vocabulary/wordDefinitionValidationFailed') {
        expect(event.type).toBe('vocabulary/wordDefinitionValidationFailed')
        expect(event.errors.some((e: string) => e.includes('Language'))).toBe(true)
      } else {
        throw new Error('Expected validation failed event')
      }
    })

    it('should emit validation failed event for invalid milestone_id', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry,
        milestone_id: 0, // Must be >= 1
      }

      const command: AddWordDefinition = {
        ...baseCommand,
        type: 'vocabulary/addWordDefinition',
        entry: invalidEntry,
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(1)
      const event = events[0]!
      if (event.type === 'vocabulary/wordDefinitionValidationFailed') {
        expect(event.type).toBe('vocabulary/wordDefinitionValidationFailed')
        expect(event.errors.some((e: string) => e.includes('Milestone'))).toBe(true)
      } else {
        throw new Error('Expected validation failed event')
      }
    })
  })

  describe('bulkAddWordDefinitions command', () => {
    const validEntry1: VocabularyEntry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      language: 'en',
      word: 'test1',
      word_type: 'CONCRETE',
      definition: {
        short: 'A short definition',
        long: 'A longer definition',
      },
      semantic_group: 'test-group',
      milestone_id: 1,
    }

    const validEntry2: VocabularyEntry = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      language: 'en',
      word: 'test2',
      word_type: 'CONCRETE',
      definition: {
        short: 'Another short definition',
        long: 'Another longer definition',
      },
      semantic_group: 'test-group',
      milestone_id: 1,
    }

    const baseCommand = {
      tenant_id: 'tenant-123',
      aggregate_id: 'aggregate-456',
    }

    it('should emit events for all valid entries', () => {
      const command = {
        ...baseCommand,
        type: 'vocabulary/bulkAddWordDefinitions' as const,
        entries: [validEntry1, validEntry2],
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events.length).toBeGreaterThanOrEqual(2)
      expect(events.some(e => e.type === 'vocabulary/wordDefinitionAdded' && e.wordId === validEntry1.id)).toBe(true)
      expect(events.some(e => e.type === 'vocabulary/wordDefinitionAdded' && e.wordId === validEntry2.id)).toBe(true)
      expect(events.some(e => e.type === 'vocabulary/bulkWordDefinitionsAdded')).toBe(true)
    })

    it('should skip duplicate entries in bulk operation', () => {
      const stateWithWord = {
        ...initialVocabularyState,
        wordIds: [validEntry1.id],
      }

      const command = {
        ...baseCommand,
        type: 'vocabulary/bulkAddWordDefinitions' as const,
        entries: [validEntry1, validEntry2], // First is duplicate
      }

      const events = decideVocabulary(stateWithWord, command, testContext)

      // Should only have events for entry2 (not duplicate entry1)
      const addedEvents = events.filter(e => e.type === 'vocabulary/wordDefinitionAdded')
      expect(addedEvents.length).toBe(1)
      expect(addedEvents[0]!.wordId).toBe(validEntry2.id)
    })

    it('should emit validation failed events for invalid entries while processing valid ones', () => {
      const invalidEntry: VocabularyEntry = {
        ...validEntry1,
        id: 'not-a-uuid',
      }

      const command = {
        ...baseCommand,
        type: 'vocabulary/bulkAddWordDefinitions' as const,
        entries: [invalidEntry, validEntry2],
      }

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events.some(e => e.type === 'vocabulary/wordDefinitionValidationFailed')).toBe(true)
      expect(events.some(e => e.type === 'vocabulary/wordDefinitionAdded')).toBe(true)
    })
  })

  describe('unknown command types', () => {
    it('should return empty array for unknown command type', () => {
      const command = {
        tenant_id: 'tenant-123',
        aggregate_id: 'aggregate-456',
        type: 'unknown/command' as any,
      } as any

      const events = decideVocabulary(initialVocabularyState, command, testContext)

      expect(events).toHaveLength(0)
    })
  })
})
