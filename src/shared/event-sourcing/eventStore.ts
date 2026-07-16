import { createEventBus, type EventBus } from '../event-bus/index.ts'
import { nextId } from '../lib/id.ts'
import type { EventEnvelope, Evolve } from './types.ts'
import type { ITeardownService } from '../services/ITeardownService.ts'
import { SecurityContextError } from '../services/ITeardownService.ts'

export interface EventStore<TState, TEvent extends { type: string }> extends ITeardownService {
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
  /** Perform absolute teardown of tenant-specific data to prevent cross-tenant leakage. */
  teardown(tenant_id?: string): void
  /** Check if the store is currently active (not torn down). */
  isActive(): boolean
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
  
  // Active state for teardown tracking
  let active = true

  const derive = (entries: readonly EventEnvelope<TEvent>[]): TState =>
    entries.reduce<TState>((acc, entry) => evolve(acc, entry.event), seed)

  const getTenantAggregateKey = (tenant_id: string, aggregate_id: string) => `${tenant_id}:${aggregate_id}`

  return {
    getState(tenant_id: string, aggregate_id: string): TState {
      // Read operation guard: Log warning and return safe default if inactive
      if (!active) {
        console.warn('⚠️ [EVENT_STORE] Store is inactive, returning seed state for getState')
        return seed
      }

      const tenant = tenantStates.get(tenant_id)
      if (!tenant) return seed
      
      return tenant.get(aggregate_id) ?? seed
    },

    getLog(tenant_id: string, aggregate_id?: string): readonly EventEnvelope<TEvent>[] {
      // Read operation guard: Log warning and return safe default if inactive
      if (!active) {
        console.warn('⚠️ [EVENT_STORE] Store is inactive, returning empty log for getLog')
        return []
      }

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
      // Mutation operation guard: Throw SecurityContextError if inactive
      if (!active) {
        throw new SecurityContextError(
          'Cannot subscribe to inactive store',
          undefined,
          undefined,
          'EventStore.subscribe'
        )
      }

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
      // Pre-operation guard: Throw SecurityContextError if inactive
      if (!active) {
        throw new SecurityContextError(
          'Cannot commit to inactive store',
          tenant_id,
          undefined,
          'EventStore.commit'
        )
      }

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

      // Post-operation safety check (simulates post-await check for async operations)
      // This prevents race conditions if teardown occurs during the operation window
      if (!active) {
        throw new SecurityContextError(
          'Store became inactive during commit operation',
          tenant_id,
          undefined,
          'EventStore.commit'
        )
      }

      if (!tenantLogs.has(tenant_id)) {
        throw new SecurityContextError(
          'Tenant was torn down during commit operation',
          tenant_id,
          undefined,
          'EventStore.commit'
        )
      }

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

    teardown(tenant_id?: string): void {
      console.log(`🧹 [EVENT_STORE] Starting teardown for tenant: ${tenant_id || 'all tenants'}`)
      
      if (!active) {
        console.warn('⚠️ [EVENT_STORE] Store is already inactive, skipping teardown')
        return
      }

      if (tenant_id) {
        // Idempotent tenant-specific teardown: If tenant already cleared, exit gracefully
        if (!tenantLogs.has(tenant_id)) {
          console.log(`ℹ️ [EVENT_STORE] Tenant ${tenant_id} cleanup already performed, skipping`)
          return
        }

        console.log(`🧹 [EVENT_STORE] Clearing tenant data: ${tenant_id}`)
        
        // Clear tenant's event logs
        tenantLogs.delete(tenant_id)
        // Clear tenant's derived states
        tenantStates.delete(tenant_id)
        
        // Clear all listeners for this tenant
        const listenersToClear: string[] = []
        for (const key of changeListeners.keys()) {
          if (key.startsWith(`${tenant_id}:`)) {
            listenersToClear.push(key)
          }
        }
        for (const key of listenersToClear) {
          changeListeners.delete(key)
        }
        
        console.log(`✅ [EVENT_STORE] Tenant ${tenant_id} torn down successfully`)
      } else {
        // Global teardown: Clear all tenant data
        console.log(`🧹 [EVENT_STORE] Clearing all tenant data (global teardown)`)
        
        const tenantCount = tenantLogs.size
        tenantLogs.clear()
        tenantStates.clear()
        changeListeners.clear()
        
        console.log(`✅ [EVENT_STORE] Global teardown complete: ${tenantCount} tenants cleared`)
        
        // Mark store as inactive after global teardown
        active = false
      }
    },

    isActive(): boolean {
      return active
    },
  }
}
