import { createEventBus, type EventBus } from '../event-bus/index.ts'
import { nextId } from '../lib/id.ts'
import type { EventEnvelope, Evolve } from './types.ts'

export interface EventStore<TState, TEvent extends { type: string }> {
  /** The current state, derived entirely by folding the event log for a specific tenant. */
  getState(tenant_id: string, aggregate_id: string): TState
  /** An immutable view of the committed event log for a specific tenant. */
  getLog(tenant_id: string, aggregate_id?: string): readonly EventEnvelope<TEvent>[]
  /** Commits events to the log, re-derives state, and notifies subscribers. 
   *  Enforces tenant isolation at the store level. */
  commit(events: readonly TEvent[], tenant_id: string, aggregate_id: string): readonly EventEnvelope<TEvent>[]
  /** Subscribe to state changes for a specific tenant (for `useSyncExternalStore`). */
  subscribe(tenant_id: string, aggregate_id: string, listener: () => void): () => void
  /** The underlying bus, for observing individual committed event envelopes. */
  readonly bus: EventBus<EventEnvelope<TEvent>>
  /** Get all tenant IDs for administrative purposes (requires elevated permissions). */
  getTenantIds(): readonly string[]
}

interface Clock {
  now(): number
}

export interface EventStoreOptions {
  clock?: Clock
}

/**
 * A multi-tenant event-sourced store. State is never mutated directly: callers
 * {@link EventStore.commit} events, and the store re-derives state by folding
 * the *entire* immutable log through `evolve` from the seed. This makes the
 * log the single source of truth and guarantees replayable, deterministic
 * state (given deterministic events).
 * 
 * Following Event-Driven Architecture Blueprint with tenant isolation.
 */
export function createEventStore<TState, TEvent extends { type: string }>(
  evolve: Evolve<TState, TEvent>,
  seed: TState,
  options: EventStoreOptions = {},
): EventStore<TState, TEvent> {
  const clock = options.clock ?? { now: () => Date.now() }
  const bus = createEventBus<EventEnvelope<TEvent>>()
  const changeListeners = new Map<string, Set<() => void>>() // tenant:aggregate -> listeners

  // Multi-tenant storage: tenant_id -> aggregate_id -> event log
  const tenantLogs = new Map<string, Map<string, readonly EventEnvelope<TEvent>[]>>()
  const tenantStates = new Map<string, Map<string, TState>>()

  const derive = (entries: readonly EventEnvelope<TEvent>[]): TState =>
    entries.reduce<TState>((acc, entry) => evolve(acc, entry.event), seed)

  const getTenantAggregateKey = (tenant_id: string, aggregate_id: string) => `${tenant_id}:${aggregate_id}`

  return {
    getState(tenant_id: string, aggregate_id: string): TState {
      const tenant = tenantStates.get(tenant_id)
      if (!tenant) return seed
      
      return tenant.get(aggregate_id) ?? seed
    },

    getLog(tenant_id: string, aggregate_id?: string): readonly EventEnvelope<TEvent>[] {
      const tenant = tenantLogs.get(tenant_id)
      if (!tenant) return []
      
      if (aggregate_id) {
        return tenant.get(aggregate_id) ?? []
      }
      
      // Return all events for the tenant (all aggregates)
      const allEvents: EventEnvelope<TEvent>[] = []
      for (const aggregateLog of tenant.values()) {
        allEvents.push(...aggregateLog)
      }
      return allEvents
    },

    subscribe(tenant_id: string, aggregate_id: string, listener: () => void): () => void {
      const key = getTenantAggregateKey(tenant_id, aggregate_id)
      const listeners = changeListeners.get(key) ?? new Set()
      changeListeners.set(key, listeners)
      listeners.add(listener)
      
      return () => {
        const currentListeners = changeListeners.get(key)
        if (currentListeners) {
          currentListeners.delete(listener)
          if (currentListeners.size === 0) {
            changeListeners.delete(key)
          }
        }
      }
    },

    commit(events: readonly TEvent[], tenant_id: string, aggregate_id: string): readonly EventEnvelope<TEvent>[] {
      if (events.length === 0) return []
      
      // Initialize tenant storage if needed
      if (!tenantLogs.has(tenant_id)) {
        tenantLogs.set(tenant_id, new Map())
        tenantStates.set(tenant_id, new Map())
      }
      
      const tenantLog = tenantLogs.get(tenant_id)!
      const tenantState = tenantStates.get(tenant_id)!
      const currentLog = tenantLog.get(aggregate_id) ?? []
      
      const baseSeq = currentLog.length
      const committed = events.map<EventEnvelope<TEvent>>((event, index) => ({
        id: nextId(),
        seq: baseSeq + index,
        timestamp: clock.now(),
        tenant_id,
        aggregate_id,
        type: event.type,
        event,
      }))

      const newLog = [...currentLog, ...committed]
      const newState = derive(newLog)
      
      tenantLog.set(aggregate_id, newLog)
      tenantState.set(aggregate_id, newState)

      // Publish full envelopes and notify listeners
      for (const entry of committed) bus.publish(entry)
      
      const key = getTenantAggregateKey(tenant_id, aggregate_id)
      const listeners = changeListeners.get(key)
      if (listeners) {
        for (const listener of [...listeners]) listener()
      }

      return committed
    },

    bus,

    getTenantIds(): readonly string[] {
      return Array.from(tenantLogs.keys())
    },
  }
}
