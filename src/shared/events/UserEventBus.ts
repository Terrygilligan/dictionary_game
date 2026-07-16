import { createEventBus } from '../event-bus'
import type { UserRegisteredEvent, UserEmailVerifiedEvent, UserAuthenticatedEvent } from './EventPublisher'

/**
 * User Event Envelope with multi-tenant identity metadata
 * All user events flow through this envelope structure to maintain
 * tenant isolation and audit transparency.
 */
export interface UserEventEnvelope {
  /** Event type for EventBus constraint (aliases eventType) */
  readonly type: string
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (user session, entity instance) */
  readonly aggregate_id: string
  /** Correlation ID from the original command that triggered this event */
  readonly correlationId: string
  /** ISO timestamp when the event was published */
  readonly timestamp: string
  /** Event type/topic for routing */
  readonly eventType: string
  /** The event payload (typed based on eventType) */
  readonly payload: unknown
  /**
   * Encryption key ID for crypto-shredding (future implementation)
   * TODO: Add this field to enable per-user key-based data deletion
   * See SCRATCHPAD.md entry 0013 for GDPR & Crypto-Shredding Readiness
   */
  // readonly encryption_key_id?: string
}

/**
 * User Event Types
 * Union of all user domain event types that flow through the UserEventBus
 */
export type UserDomainEvent =
  | UserRegisteredEvent
  | UserEmailVerifiedEvent
  | UserAuthenticatedEvent

/**
 * User Event Bus
 * 
 * A typed event bus for user domain events that carries multi-tenant
 * identity metadata in the envelope. This enables proper tenant isolation
 * and audit transparency throughout the event-driven architecture.
 * 
 * Architectural Compliance:
 * - Multi-Tenant: tenant_id and aggregate_id in every envelope
 * - Event-Sourcing: Immutable event flow with audit trail
 * - Type Safety: Strongly typed event payloads
 * - Decoupling: OutboxProcessor publishes, services subscribe
 */
export interface IUserEventBus {
  /** Publish a user event with envelope metadata */
  publish(event: UserEventEnvelope): void
  
  /** Subscribe to specific user event type */
  subscribe<TType extends UserDomainEvent['eventType']>(
    eventType: TType,
    listener: (envelope: UserEventEnvelope) => void
  ): () => void
  
  /** Subscribe to all user events */
  subscribeAll(listener: (envelope: UserEventEnvelope) => void): () => void
}

/**
 * Create User Event Bus
 * 
 * Factory function that creates a typed event bus for user domain events.
 * The bus is initialized empty and populated through publish calls.
 */
export function createUserEventBus(): IUserEventBus {
  const bus = createEventBus<UserEventEnvelope>()

  return {
    publish(event: UserEventEnvelope): void {
      bus.publish(event)
    },

    subscribe<TType extends UserDomainEvent['eventType']>(
      eventType: TType,
      listener: (envelope: UserEventEnvelope) => void
    ): () => void {
      return bus.subscribe(eventType, listener)
    },

    subscribeAll(listener: (envelope: UserEventEnvelope) => void): () => void {
      return bus.subscribeAll(listener)
    },
  }
}

/**
 * Singleton User Event Bus instance
 * 
 * This is the shared bus instance used throughout the application.
 * OutboxProcessor publishes to this bus, and services (EmailVerificationService,
 * UserProjectionService) subscribe to it.
 */
export const userEventBus = createUserEventBus()

/**
 * Helper function to create a user event envelope
 * 
 * Wraps a user domain event with multi-tenant identity metadata.
 * This ensures all events flowing through the bus have proper audit information.
 */
export function createUserEventEnvelope(
  tenant_id: string,
  aggregate_id: string,
  correlationId: string,
  event: UserDomainEvent
): UserEventEnvelope {
  return {
    type: event.eventType, // EventBus constraint
    tenant_id,
    aggregate_id,
    correlationId,
    timestamp: event.timestamp,
    eventType: event.eventType,
    payload: event.payload,
  }
}
