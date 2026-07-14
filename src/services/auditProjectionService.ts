import type { EventEnvelope } from '../shared/event-sourcing/types.ts'
import type { EventStore } from '../shared/event-sourcing/eventStore.ts'
import type { GameEvent } from '../entities/game/model/events.ts'
import type { UserEvent } from '../entities/user/model/events.ts'
import type { VillageEvent } from '../entities/village/model/events.ts'
import { createEventBus } from '../shared/event-bus/index.ts'
import {
  AuditProjection,
  createAuditProjection,
  type AuditEvent,
  type TenantMetrics,
  type EventTypeMetrics,
  type SystemMetrics,
  type AuditFilter,
  type AuditQuery,
  type AuditProjectionState,
} from '../entities/audit/model/index.ts'

export type SystemEvent = GameEvent | UserEvent | VillageEvent

export interface AuditProjectionService {
  /** Start the audit projection and begin processing events */
  start(): Promise<void>
  
  /** Stop the audit projection and cleanup resources */
  stop(): Promise<void>
  
  /** Get current audit projection state */
  getState(): AuditProjectionState
  
  /** Query events with optional filtering */
  queryEvents(query: AuditQuery): readonly AuditEvent[]
  
  /** Get system-wide metrics */
  getMetrics(): SystemMetrics
  
  /** Get metrics for specific tenant */
  getTenantMetrics(tenant_id: string): TenantMetrics | null
  
  /** Export events to specified format */
  exportEvents(filter: AuditFilter, format: 'json' | 'csv'): Promise<string>

  /** Get the underlying AuditProjection for the dashboard */
  getAuditProjection(): AuditProjection

  /** Subscribe to audit projection updates */
  subscribe(listener: (state: AuditProjectionState) => void): () => void
}

export interface AuditProjectionOptions {
  /** Batch size for processing events */
  batch_size?: number
  /** Update interval for metrics calculation */
  metrics_interval?: number
  /** Maximum events to keep in memory */
  max_events?: number
  /** Enable debug logging */
  debug?: boolean
}

export function createAuditProjectionService(
  gameStore: EventStore<unknown, GameEvent>,
  userStore: EventStore<unknown, UserEvent>,
  villageStore?: EventStore<unknown, VillageEvent>,
  options: AuditProjectionOptions = {}
): AuditProjectionService {
  const {
    metrics_interval = 5000,
    max_events = 10000,
    debug = false,
  } = options

  let is_running = false
  let projection_state: AuditProjectionState = {
    events: [],
    metrics: {
      total_events: 0,
      total_tenants: 0,
      active_tenants: 0,
      error_rate: 0,
      events_per_second: 0,
      last_updated: Date.now(),
      top_event_types: [],
      tenant_metrics: [],
    },
    is_loading: false,
    last_updated: 0,
    subscription_active: false,
  }
  
  const listeners = new Set<(state: AuditProjectionState) => void>()
  const event_cache = new Map<string, AuditEvent>()
  const tenant_metrics = new Map<string, TenantMetrics>()
  const event_type_metrics = new Map<string, EventTypeMetrics>()

  const auditProjection = createAuditProjection(createEventBus<SystemEvent>())
  let store_unsubscribers: Array<() => void> = []
  let metrics_timer: NodeJS.Timeout | null = null

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[AuditProjection] ${message}`, ...args)
    }
  }

  const extractAggregateType = (event_type: string): 'user' | 'game' | 'village' => {
    if (event_type.startsWith('user/') || event_type.startsWith('profile/') || event_type.startsWith('achievement/') || event_type.startsWith('friend/') || event_type.startsWith('stats/') || event_type.startsWith('sync/')) {
      return 'user'
    }
    if (event_type.startsWith('game/') || event_type.startsWith('answer/') || event_type.startsWith('round/') || event_type.startsWith('streak/') || event_type.startsWith('language/') || event_type.startsWith('difficulty/') || event_type.startsWith('audio/') || event_type.startsWith('term/') || event_type.startsWith('feedback/') || event_type.startsWith('voice/')) {
      return 'game'
    }
    return 'village'
  }

  const processEvent = (envelope: EventEnvelope<SystemEvent>): AuditEvent => {
    // Forward the real EventStore envelope to the audit projection
    auditProjection.processEvent(envelope as EventEnvelope<GameEvent | UserEvent | VillageEvent>)

    const audit_event: AuditEvent = {
      id: envelope.id,
      tenant_id: envelope.tenant_id,
      aggregate_id: envelope.aggregate_id,
      aggregate_type: extractAggregateType(envelope.event.type),
      event_type: envelope.event.type,
      timestamp: envelope.timestamp,
      sequence: envelope.seq,
      metadata: envelope.event as unknown as Record<string, unknown>,
      processed_at: Date.now(),
    }

    // Update cache
    event_cache.set(audit_event.id, audit_event)

    // Maintain cache size
    if (event_cache.size > max_events) {
      const oldest_key = Array.from(event_cache.keys())[0] ?? ''
      event_cache.delete(oldest_key)
    }

    // Update tenant metrics
    updateTenantMetrics(audit_event)

    // Update event type metrics
    updateEventTypeMetrics(audit_event)

    return audit_event
  }

  const updateTenantMetrics = (event: AuditEvent) => {
    const existing = tenant_metrics.get(event.tenant_id)
    
    if (existing) {
      const updated: TenantMetrics = {
        ...existing,
        event_count: existing.event_count + 1,
        last_activity: Math.max(existing.last_activity, event.timestamp),
        error_count: event.event_type.includes('failed') || event.event_type.includes('error') 
          ? existing.error_count + 1 
          : existing.error_count,
      }
      tenant_metrics.set(event.tenant_id, updated)
    } else {
      const new_metrics: TenantMetrics = {
        tenant_id: event.tenant_id,
        event_count: 1,
        last_activity: event.timestamp,
        user_count: event.aggregate_type === 'user' ? 1 : 0,
        game_sessions: event.aggregate_type === 'game' ? 1 : 0,
        error_count: event.event_type.includes('failed') || event.event_type.includes('error') ? 1 : 0,
        created_at: event.timestamp,
      }
      tenant_metrics.set(event.tenant_id, new_metrics)
    }
  }

  const updateEventTypeMetrics = (event: AuditEvent) => {
    const existing = event_type_metrics.get(event.event_type)
    
    if (existing) {
      const updated: EventTypeMetrics = {
        ...existing,
        count: existing.count + 1,
        last_seen: event.timestamp,
      }
      event_type_metrics.set(event.event_type, updated)
    } else {
      const new_metrics: EventTypeMetrics = {
        event_type: event.event_type,
        count: 1,
        first_seen: event.timestamp,
        last_seen: event.timestamp,
        error_rate: event.event_type.includes('failed') || event.event_type.includes('error') ? 1 : 0,
        avg_processing_time: 0,
      }
      event_type_metrics.set(event.event_type, new_metrics)
    }
  }

  const calculateMetrics = (): SystemMetrics => {
    const all_events = Array.from(event_cache.values())
    const total_events = all_events.length
    const unique_tenants = new Set(all_events.map(e => e.tenant_id)).size
    
    const error_events = all_events.filter(e => 
      e.event_type.includes('failed') || e.event_type.includes('error')
    )
    const error_rate = total_events > 0 ? error_events.length / total_events : 0
    
    // Calculate events per second (last minute)
    const one_minute_ago = Date.now() - 60000
    const recent_events = all_events.filter(e => e.processed_at > one_minute_ago)
    const events_per_second = recent_events.length / 60

    // Get top event types
    const top_event_types = Array.from(event_type_metrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get tenant metrics
    const tenant_metrics_array = Array.from(tenant_metrics.values())
      .sort((a, b) => b.last_activity - a.last_activity)

    // Calculate active tenants (active in last hour)
    const one_hour_ago = Date.now() - 3600000
    const active_tenants = tenant_metrics_array.filter(t => t.last_activity > one_hour_ago).length

    return {
      total_events,
      total_tenants: unique_tenants,
      active_tenants,
      error_rate,
      events_per_second,
      last_updated: Date.now(),
      top_event_types,
      tenant_metrics: tenant_metrics_array,
    }
  }

  const updateProjectionState = () => {
    const events = Array.from(event_cache.values())
      .sort((a, b) => b.timestamp - a.timestamp)
    
    projection_state = {
      ...projection_state,
      events,
      metrics: calculateMetrics(),
      is_loading: false,
      last_updated: Date.now(),
      subscription_active: is_running,
    }

    // Notify listeners
    for (const listener of listeners) {
      listener(projection_state)
    }
  }

  const processAllEvents = async () => {
    log('Processing all events from stores')

    // Process game events
    if (gameStore && typeof gameStore.getTenantIds === 'function') {
      const game_tenants = gameStore.getTenantIds()
      for (const tenant_id of game_tenants) {
        const game_events = gameStore.getLog(tenant_id)
        for (const envelope of game_events) {
          processEvent(envelope as EventEnvelope<SystemEvent>)
        }
      }
    }

    // Process user events
    if (userStore && typeof userStore.getTenantIds === 'function') {
      const user_tenants = userStore.getTenantIds()
      for (const tenant_id of user_tenants) {
        const user_events = userStore.getLog(tenant_id)
        for (const envelope of user_events) {
          processEvent(envelope as EventEnvelope<SystemEvent>)
        }
      }
    }

    // Process village events
    if (villageStore && typeof villageStore.getTenantIds === 'function') {
      const village_tenants = villageStore.getTenantIds()
      for (const tenant_id of village_tenants) {
        const village_events = villageStore.getLog(tenant_id)
        for (const envelope of village_events) {
          processEvent(envelope as EventEnvelope<SystemEvent>)
        }
      }
    }

    updateProjectionState()
    log(`Processed ${event_cache.size} total events`)
  }

  const subscribeToStores = (): Array<() => void> => {
    const unsubscribers: Array<() => void> = []

    // Subscribe to game store events
    if (gameStore?.bus?.subscribeAll) {
      unsubscribers.push(
        gameStore.bus.subscribeAll((envelope) => {
          processEvent(envelope as EventEnvelope<SystemEvent>)
          updateProjectionState()
        })
      )
    }

    // Subscribe to user store events
    if (userStore?.bus?.subscribeAll) {
      unsubscribers.push(
        userStore.bus.subscribeAll((envelope) => {
          processEvent(envelope as EventEnvelope<SystemEvent>)
          updateProjectionState()
        })
      )
    }

    // Subscribe to village store events
    if (villageStore?.bus?.subscribeAll) {
      unsubscribers.push(
        villageStore.bus.subscribeAll((envelope) => {
          processEvent(envelope as EventEnvelope<SystemEvent>)
          updateProjectionState()
        })
      )
    }

    return unsubscribers
  }

  return {
    async start(): Promise<void> {
      if (is_running) {
        log('Projection already running')
        return
      }

      log('Starting audit projection service')
      is_running = true
      projection_state = {
        ...projection_state,
        is_loading: true,
      }

      // Process existing events
      await processAllEvents()

      // Subscribe to new events
      store_unsubscribers = subscribeToStores()

      // Start metrics calculation interval
      metrics_timer = setInterval(updateProjectionState, metrics_interval)

      projection_state = {
        ...projection_state,
        subscription_active: true,
      }
      updateProjectionState()
      
      log('Audit projection service started successfully')
    },

    async stop(): Promise<void> {
      if (!is_running) {
        log('Projection not running')
        return
      }

      log('Stopping audit projection service')
      is_running = false
      projection_state = {
        ...projection_state,
        subscription_active: false,
      }

      if (metrics_timer) {
        clearInterval(metrics_timer)
        metrics_timer = null
      }

      // Unsubscribe from store buses
      for (const unsubscribe of store_unsubscribers) {
        unsubscribe()
      }
      store_unsubscribers = []

      // Clear subscriptions
      listeners.clear()

      updateProjectionState()
      log('Audit projection service stopped')
    },

    getState(): AuditProjectionState {
      return projection_state
    },

    queryEvents(query: AuditQuery): readonly AuditEvent[] {
      let filtered_events = Array.from(event_cache.values())

      // Apply filters
      if (query.filter.tenant_id) {
        filtered_events = filtered_events.filter(e => e.tenant_id === query.filter.tenant_id)
      }

      if (query.filter.aggregate_type) {
        filtered_events = filtered_events.filter(e => e.aggregate_type === query.filter.aggregate_type)
      }

      if (query.filter.event_type) {
        filtered_events = filtered_events.filter(e => e.event_type === query.filter.event_type)
      }

      if (query.filter.start_time) {
        filtered_events = filtered_events.filter(e => e.timestamp >= query.filter.start_time!)
      }

      if (query.filter.end_time) {
        filtered_events = filtered_events.filter(e => e.timestamp <= query.filter.end_time!)
      }

    // Sort
      filtered_events.sort((a, b) => {
        const a_val = a[query.sort_by] as number | string
        const b_val = b[query.sort_by] as number | string
        
        if (query.sort_direction === 'asc') {
          return a_val > b_val ? 1 : -1
        } else {
          return a_val < b_val ? 1 : -1
        }
      })

      // Apply pagination
      const offset = query.filter.offset || 0
      const limit = query.filter.limit || 100
      
      return filtered_events.slice(offset, offset + limit)
    },

    getMetrics(): SystemMetrics {
      return calculateMetrics()
    },

    getTenantMetrics(tenant_id: string): TenantMetrics | null {
      return tenant_metrics.get(tenant_id) || null
    },

    getAuditProjection(): AuditProjection {
      return auditProjection
    },

    async exportEvents(filter: AuditFilter, format: 'json' | 'csv'): Promise<string> {
      const query: AuditQuery = {
        filter,
        sort_by: 'timestamp',
        sort_direction: 'desc'
      }
      
      const events = this.queryEvents(query)
      
      if (format === 'json') {
        return JSON.stringify(events, null, 2)
      } else {
        // CSV export
        const headers = ['id', 'tenant_id', 'aggregate_id', 'aggregate_type', 'event_type', 'timestamp', 'sequence', 'processed_at']
        const rows = events.map(event => 
          headers.map(header => event[header as keyof AuditEvent]).join(',')
        )
        
        return [headers.join(','), ...rows].join('\n')
      }
    },

    subscribe(listener: (state: AuditProjectionState) => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
