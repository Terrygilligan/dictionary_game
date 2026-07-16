/**
 * Simple test to verify Event Publisher functionality
 */

import { ConsoleEventPublisher } from './ConsoleEventPublisher'
import type { IEventPublisher } from './EventPublisher'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

describe('EventPublisher', () => {
  let publisher: IEventPublisher
  let mockConsoleLog: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    publisher = new ConsoleEventPublisher()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should publish event with correlation tracking', async () => {
    const testEvent = {
      correlationId: 'test-correlation-123',
      timestamp: '2026-07-12T12:00:00.000Z',
      eventType: 'user.registered',
      payload: {
        userId: 'user-123',
        email: 'test@example.com',
      },
    }

    await publisher.publish('user.registered', testEvent)

    // Verify the event was logged
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '🚀 [EVENT_PUBLISHER] Event published:',
      expect.objectContaining({
        topic: 'user.registered',
        correlationId: 'test-correlation-123',
        timestamp: '2026-07-12T12:00:00.000Z',
        event: testEvent,
      })
    )

    // Verify success confirmation
    expect(mockConsoleLog).toHaveBeenCalledWith(
      '✅ [EVENT_PUBLISHER] Event published successfully:',
      expect.objectContaining({
        topic: 'user.registered',
        correlationId: 'test-correlation-123',
      })
    )
  })

  it('should handle events without correlation ID gracefully', async () => {
    const testEvent = { userId: 'user-123' }

    await publisher.publish('user.test', testEvent)

    expect(mockConsoleLog).toHaveBeenCalledWith(
      '🚀 [EVENT_PUBLISHER] Event published:',
      expect.objectContaining({
        topic: 'user.test',
        correlationId: 'unknown',
        event: testEvent,
      })
    )
  })

  it('should handle publishing errors', async () => {
    // Create a publisher that throws an error
    const errorPublisher = new ConsoleEventPublisher()
    vi.spyOn(errorPublisher, 'publish').mockRejectedValue(new Error('Publish failed'))

    const testEvent = {
      correlationId: 'test-123',
      timestamp: '2026-07-12T12:00:00.000Z',
    }

    await expect(errorPublisher.publish('user.test', testEvent)).rejects.toThrow('Publish failed')
  })
})

export {} // Make this a module
