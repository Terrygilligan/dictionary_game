import { createEventBus } from '@/shared/event-bus'
import type { VillageEvent } from './events'

/**
 * Village Event Envelope
 * 
 * Wraps village domain events with multi-tenant identity metadata
 * for audit trail continuity and proper isolation enforcement.
 */
export interface VillageEventEnvelope {
  /** Event type for EventBus constraint */
  readonly type: string
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (village session, entity instance) */
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
 * Village Event Bus Interface
 * 
 * Provides type-safe event subscription and publishing for village domain events.
 * Maintains multi-tenant isolation through envelope metadata enforcement.
 */
export interface IVillageEventBus {
  /** Publish an event to the bus */
  publish(envelope: VillageEventEnvelope): void
  /** Subscribe to all village events */
  subscribeAll(listener: (envelope: VillageEventEnvelope) => void): () => void
  /** Subscribe to a specific event type */
  subscribe<TType extends VillageEvent['type']>(
    eventType: TType,
    listener: (envelope: VillageEventEnvelope) => void
  ): () => void
}

/**
 * Village Event Bus Implementation
 * 
 * Singleton instance that manages village domain event distribution
 * with strict multi-tenant envelope enforcement.
 */
const bus = createEventBus<VillageEventEnvelope>()

export const villageEventBus: IVillageEventBus = {
  publish(envelope) {
    bus.publish(envelope)
  },

  subscribeAll(listener) {
    return bus.subscribeAll(listener)
  },

  subscribe<TType extends VillageEvent['type']>(
    eventType: TType,
    listener: (envelope: VillageEventEnvelope) => void
  ) {
    return bus.subscribe(eventType, listener)
  },
}

/**
 * Create a village event envelope with required identity metadata
 * 
 * @param tenant_id - Tenant identifier for multi-tenant isolation
 * @param aggregate_id - Aggregate identifier for event sourcing
 * @param correlationId - Correlation ID for audit trail continuity
 * @param event - The domain event to wrap
 * @returns Envelope with identity metadata
 */
export function createVillageEventEnvelope(
  tenant_id: string,
  aggregate_id: string,
  correlationId: string,
  event: VillageEvent
): VillageEventEnvelope {
  return {
    type: event.type, // EventBus constraint
    tenant_id,
    aggregate_id,
    correlationId,
    timestamp: new Date().toISOString(), // Generate timestamp at envelope creation
    payload: event,
  }
}
