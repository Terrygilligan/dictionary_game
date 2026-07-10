/**
 * Audit Projection Core - Real-time Event Stream Monitoring
 * 
 * This projection subscribes to the global EventBus and maintains an in-memory
 * audit log of all events across all tenants for the SuperAdmin Dashboard.
 * 
 * Architecture Note: This is a READ-ONLY projection that never mutates state.
 * It simply observes and indexes events for audit visibility.
 */

import type { EventBus } from '../../shared/event-bus/index.ts'
import type { EventEnvelope } from '../../shared/event-sourcing/types.ts'
import type { GameEvent } from '../game/model/events.ts'
import type { UserEvent } from '../user/model/events.ts'
import type { VillageEvent } from '../village/model/events.ts'

/**
 * Unified audit event that captures the full EventEnvelope structure
 * This is what the dashboard will display and query against
 */
export interface AuditLogEntry {
  /** Unique identifier for this audit entry */
  readonly id: string
  /** Full event envelope with all metadata */
  readonly envelope: EventEnvelope<GameEvent | UserEvent | VillageEvent>
  /** Computed fields for easier querying */
  readonly eventType: string
  readonly tenantId: string
  readonly aggregateId: string
  readonly timestamp: number
  /** Parsed event payload for display */
  readonly payload: Record<string, unknown>
}

/**
 * In-memory audit log structure
 * Optimized for fast queries and real-time updates
 */
export interface AuditLog {
  /** Sequential list of all audit entries */
  readonly entries: readonly AuditLogEntry[]
  /** Index by tenant for fast tenant-specific queries */
  readonly byTenant: ReadonlyMap<string, readonly AuditLogEntry[]>
  /** Index by event type for fast type-specific queries */
  readonly byEventType: ReadonlyMap<string, readonly AuditLogEntry[]>
  /** Most recent events (capped for performance) */
  readonly recent: readonly AuditLogEntry[]
  /** Statistics for dashboard metrics */
  readonly stats: AuditLogStats
}

/** Audit log statistics for dashboard metrics */
export interface AuditLogStats {
  readonly totalEvents: number
  readonly totalTenants: number
  readonly eventTypes: readonly string[]
  readonly oldestEvent: number | null
  readonly newestEvent: number | null
  readonly eventsPerSecond: number
}

/** Configuration for audit projection behavior */
export interface AuditProjectionConfig {
  /** Maximum number of events to keep in memory (default: 10000) */
  readonly maxEvents?: number
  /** Maximum number of recent events to track (default: 1000) */
  readonly maxRecentEvents?: number
  /** Events per second calculation window in ms (default: 60000) */
  readonly eventsPerSecondWindow?: number
  /** Enable debug logging (default: false) */
  readonly debug?: boolean
}

/**
 * Audit Projection - The core engine for real-time event monitoring
 * 
 * This projection subscribes to ALL event buses and maintains a comprehensive
 * audit log for the SuperAdmin Dashboard. It's designed to be completely
 * read-only and never interferes with the write path.
 */
export class AuditProjection {
  private readonly config: Required<AuditProjectionConfig>
  private readonly eventBus: EventBus<GameEvent | UserEvent | VillageEvent>
  private entries: AuditLogEntry[] = []
  private byTenant = new Map<string, AuditLogEntry[]>()
  private byEventType = new Map<string, AuditLogEntry[]>()
  private recent: AuditLogEntry[] = []
  private isStarted = false
  private eventTimestamps: number[] = []

  constructor(
    eventBus: EventBus<GameEvent | UserEvent | VillageEvent>,
    config: AuditProjectionConfig = {}
  ) {
    this.eventBus = eventBus
    this.config = {
      maxEvents: config.maxEvents ?? 10000,
      maxRecentEvents: config.maxRecentEvents ?? 1000,
      eventsPerSecondWindow: config.eventsPerSecondWindow ?? 60000,
      debug: config.debug ?? false,
    }

    this.log('AuditProjection initialized with config:', this.config)
  }

  /**
   * Start the audit projection and begin subscribing to events
   */
  start(): void {
    if (this.isStarted) {
      this.log('AuditProjection already started')
      return
    }

    this.log('Starting AuditProjection...')
    
    // Subscribe to the global event bus
    this.eventBus.subscribeAll((event: GameEvent | UserEvent | VillageEvent) => this.handleEvent(event))
    
    this.isStarted = true
    this.log('AuditProjection started successfully')
  }

  /**
   * Stop the audit projection and cleanup resources
   */
  stop(): void {
    if (!this.isStarted) {
      this.log('AuditProjection not running')
      return
    }

    this.log('Stopping AuditProjection...')
    
    // Note: In a real implementation, we'd need to unsubscribe from the event bus
    // For now, we'll just mark as stopped since our EventBus doesn't support unsubscribe
    
    this.isStarted = false
    this.log('AuditProjection stopped')
  }

  /**
   * Get the current audit log state
   */
  getAuditLog(): AuditLog {
    return {
      entries: [...this.entries],
      byTenant: new Map(this.byTenant),
      byEventType: new Map(this.byEventType),
      recent: [...this.recent],
      stats: this.calculateStats(),
    }
  }

  /**
   * Handle incoming events from the EventBus
   * This is the core event processing logic
   */
  private handleEvent(event: GameEvent | UserEvent | VillageEvent, _envelope?: EventEnvelope<GameEvent | UserEvent | VillageEvent>): void {
    if (!this.isStarted) {
      return
    }

    try {
      // Create audit entry
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        envelope: this.createEventEnvelope(event),
        eventType: event.type,
        tenantId: this.extractTenantId(event),
        aggregateId: this.extractAggregateId(event),
        timestamp: Date.now(),
        payload: event as unknown as Record<string, unknown>,
      }

      // Add to audit log
      this.addAuditEntry(auditEntry)

      this.log('Processed event:', event.type, 'for tenant:', auditEntry.tenantId)
    } catch (error) {
      this.log('Error processing event:', error)
    }
  }

  /**
   * Add an audit entry to all indexes
   */
  private addAuditEntry(entry: AuditLogEntry): void {
    // Add to main entries array
    this.entries.push(entry)

    // Maintain max events limit
    if (this.entries.length > this.config.maxEvents) {
      const removed = this.entries.shift()
      if (removed) {
        this.removeFromIndexes(removed)
      }
    }

    // Update tenant index
    const tenantEntries = this.byTenant.get(entry.tenantId) || []
    tenantEntries.push(entry)
    this.byTenant.set(entry.tenantId, tenantEntries)

    // Update event type index
    const typeEntries = this.byEventType.get(entry.eventType) || []
    typeEntries.push(entry)
    this.byEventType.set(entry.eventType, typeEntries)

    // Update recent events
    this.recent.push(entry)
    if (this.recent.length > this.config.maxRecentEvents) {
      this.recent.shift()
    }

    // Update events per second calculation
    this.eventTimestamps.push(entry.timestamp)
    this.cleanupEventTimestamps()
  }

  /**
   * Remove an entry from all indexes (for cleanup)
   */
  private removeFromIndexes(entry: AuditLogEntry): void {
    // Remove from tenant index
    const tenantEntries = this.byTenant.get(entry.tenantId) || []
    const filteredTenant = tenantEntries.filter(e => e.id !== entry.id)
    this.byTenant.set(entry.tenantId, filteredTenant)

    // Remove from event type index
    const typeEntries = this.byEventType.get(entry.eventType) || []
    const filteredType = typeEntries.filter(e => e.id !== entry.id)
    this.byEventType.set(entry.eventType, filteredType)
  }

  /**
   * Calculate audit log statistics
   */
  private calculateStats(): AuditLogStats {
    const totalEvents = this.entries.length
    const totalTenants = this.byTenant.size
    const eventTypes = Array.from(this.byEventType.keys())
    
    const oldestEvent = this.entries.length > 0 ? this.entries[0]?.timestamp ?? null : null
    const newestEvent = this.entries.length > 0 
      ? this.entries[this.entries.length - 1]?.timestamp ?? null 
      : null

    const eventsPerSecond = this.calculateEventsPerSecond()

    return {
      totalEvents,
      totalTenants,
      eventTypes,
      oldestEvent,
      newestEvent,
      eventsPerSecond,
    }
  }

  /**
   * Calculate events per second based on recent timestamps
   */
  private calculateEventsPerSecond(): number {
    const now = Date.now()
    const windowStart = now - this.config.eventsPerSecondWindow
    
    const recentEvents = this.eventTimestamps.filter(ts => ts > windowStart)
    return recentEvents.length / (this.config.eventsPerSecondWindow / 1000)
  }

  /**
   * Clean up old timestamps for events per second calculation
   */
  private cleanupEventTimestamps(): void {
    const now = Date.now()
    const windowStart = now - this.config.eventsPerSecondWindow
    
    this.eventTimestamps = this.eventTimestamps.filter(ts => ts > windowStart)
  }

  /**
   * Create a mock EventEnvelope for the audit entry
   * In a real implementation, this would come from the actual EventStore
   */
  private createEventEnvelope(event: GameEvent | UserEvent | VillageEvent): EventEnvelope<GameEvent | UserEvent | VillageEvent> {
    return {
      id: this.generateEventId(),
      seq: this.entries.length + 1,
      timestamp: Date.now(),
      tenant_id: this.extractTenantId(event),
      aggregate_id: this.extractAggregateId(event),
      event,
    }
  }

  /**
   * Extract tenant ID from event (mock implementation)
   * In a real implementation, this would be part of the event structure
   */
  private extractTenantId(event: GameEvent | UserEvent | VillageEvent): string {
    // For game events, use the tenant_id if available
    if ('tenant_id' in event) {
      return (event as any).tenant_id || 'system'
    }
    
    // For user events, extract from userId
    if ('userId' in event) {
      return `user-${(event as any).userId}`
    }
    
    // Default fallback
    return 'unknown'
  }

  /**
   * Extract aggregate ID from event (mock implementation)
   */
  private extractAggregateId(event: GameEvent | UserEvent | VillageEvent): string {
    if ('aggregate_id' in event) {
      return (event as any).aggregate_id || 'system'
    }
    
    if ('userId' in event) {
      return (event as any).userId
    }
    
    return 'system'
  }

  /**
   * Generate unique audit entry ID
   */
  private generateAuditId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Debug logging utility
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[AuditProjection]', ...args)
    }
  }
}

/**
 * Factory function to create and configure an AuditProjection
 */
export function createAuditProjection(
  eventBus: EventBus<GameEvent | UserEvent | VillageEvent>,
  config?: AuditProjectionConfig
): AuditProjection {
  return new AuditProjection(eventBus, config)
}
