import { createEventBus } from '@/shared/event-bus'
import type { GameEvent } from './events.ts'

/**
 * Game Event Envelope with multi-tenant identity metadata
 * All game events flow through this envelope structure to maintain
 * tenant isolation and audit transparency.
 */
export interface GameEventEnvelope {
  /** Event type for EventBus constraint */
  readonly type: string
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (game session, entity instance) */
  readonly aggregate_id: string
  /** Correlation ID from the original command that triggered this event */
  readonly correlationId: string
  /** ISO timestamp when the event was published */
  readonly timestamp: string
  /** The event payload (typed based on type) */
  readonly payload: unknown
  /**
   * Encryption key ID for crypto-shredding (future implementation)
   * TODO: Add this field to enable per-user key-based data deletion
   * See SCRATCHPAD.md entry 0013 for GDPR & Crypto-Shredding Readiness
   */
  // readonly encryption_key_id?: string
}

/**
 * Game Event Types
 * Union of all game domain event types that flow through the GameEventBus
 */
export type GameDomainEvent = GameEvent

/**
 * Game Event Bus
 * 
 * A typed event bus for game domain events that carries multi-tenant
 * identity metadata in the envelope. This enables proper tenant isolation
 * and audit transparency throughout the event-driven architecture.
 * 
 * Architectural Compliance:
 * - Multi-Tenant: tenant_id and aggregate_id in every envelope
 * - Event-Sourcing: Immutable event flow with audit trail
 * - Type Safety: Strongly typed event payloads
 * - Decoupling: GameStore publishes, services subscribe
 */
export interface IGameEventBus {
  /** Publish a game event with envelope metadata */
  publish(event: GameEventEnvelope): void
  
  /** Subscribe to specific game event type */
  subscribe<TType extends GameDomainEvent['type']>(
    eventType: TType,
    listener: (envelope: GameEventEnvelope) => void
  ): () => void
  
  /** Subscribe to all game events */
  subscribeAll(listener: (envelope: GameEventEnvelope) => void): () => void
}

/**
 * Create Game Event Bus
 * 
 * Factory function that creates a typed event bus for game domain events.
 * The bus is initialized empty and populated through publish calls.
 */
export function createGameEventBus(): IGameEventBus {
  const bus = createEventBus<GameEventEnvelope>()

  return {
    publish(event: GameEventEnvelope): void {
      bus.publish(event)
    },

    subscribe<TType extends GameDomainEvent['type']>(
      eventType: TType,
      listener: (envelope: GameEventEnvelope) => void
    ): () => void {
      return bus.subscribe(eventType, listener)
    },

    subscribeAll(listener: (envelope: GameEventEnvelope) => void): () => void {
      return bus.subscribeAll(listener)
    },
  }
}

/**
 * Singleton Game Event Bus instance
 * 
 * This is the shared bus instance used throughout the application.
 * GameStore publishes to this bus, and services (GameAuditService) subscribe to it.
 */
export const gameEventBus = createGameEventBus()

/**
 * Helper function to create a game event envelope
 * 
 * Wraps a game domain event with multi-tenant identity metadata.
 * This ensures all events flowing through the bus have proper audit information.
 */
export function createGameEventEnvelope(
  tenant_id: string,
  aggregate_id: string,
  correlationId: string,
  event: GameDomainEvent
): GameEventEnvelope {
  return {
    type: event.type, // EventBus constraint
    tenant_id,
    aggregate_id,
    correlationId,
    timestamp: new Date().toISOString(), // Generate timestamp at envelope creation
    payload: event,
  }
}
