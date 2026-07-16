import type { IEventPublisher } from './EventPublisher'

/**
 * Console Event Publisher
 * 
 * A development-focused implementation that logs events to the console.
 * This provides immediate visibility into event flow during development
 * and testing, with correlation tracking for debugging.
 * 
 * In production, this would be replaced with a Pub/Sub implementation.
 */
export class ConsoleEventPublisher implements IEventPublisher {
  /**
   * Publish an event by logging it to the console
   * 
   * @param topic - The event topic/channel
   * @param event - The event payload to publish
   * @returns Promise resolving to publish result
   */
  async publish<T>(topic: string, event: T): Promise<void> {
    try {
      // Extract correlation ID and timestamp if available
      const correlationId = (event as any).correlationId || 'unknown'
      const timestamp = (event as any).timestamp || new Date().toISOString()
      
      // Log the event with structured formatting
      console.log('🚀 [EVENT_PUBLISHER] Event published:', {
        topic,
        correlationId,
        timestamp,
        event,
      })

      // Simulate async publishing delay (for realistic behavior)
      await new Promise(resolve => setTimeout(resolve, 1))
      
      console.log('✅ [EVENT_PUBLISHER] Event published successfully:', {
        topic,
        correlationId,
        publishedAt: new Date().toISOString(),
      })

    } catch (error) {
      console.error('❌ [EVENT_PUBLISHER] Failed to publish event:', {
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      })
      
      // Re-throw to maintain error handling contract
      throw error
    }
  }
}

/**
 * Export singleton instance for easy dependency injection
 */
export const consoleEventPublisher = new ConsoleEventPublisher()

/**
 * Export type for dependency injection
 */
export type { IEventPublisher } from './EventPublisher'
