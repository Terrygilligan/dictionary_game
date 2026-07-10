/**
 * Audit Projection
 * 
 * Provides comprehensive audit visibility into the event-sourced system.
 * Maintains an in-memory list of recent events across all tenants for
 * SuperAdmin dashboard monitoring and compliance tracking.
 * 
 * Following Event-Driven Architecture Blueprint:
 * - Event-First: Subscribes to global EventBus for all events
 * - Multi-Tenant: Captures events from all tenants with proper isolation
 * - Immutable: Maintains immutable audit log of all system events
 * - Projection: Projects events into queryable audit data structure
 */

import type { EventEnvelope } from '@/shared/event-sourcing'
import type { GameEvent } from '@/entities/game'
import type { AudioEvent } from '@/entities/game/model/audioEvents.ts'
import type { UserEvent } from '@/entities/user'
import { createEventBus } from '@/shared/event-bus'

/**
 * Audit Log Entry Structure
 * 
 * Captures the complete context of each system event for audit purposes.
 * Includes timing, tenant context, event type, and full payload data.
 */
export interface AuditLogEntry {
  /** Unique identifier for this audit entry */
  readonly id: string
  /** Full event envelope from event store */
  readonly eventEnvelope: EventEnvelope<GameEvent | AudioEvent | UserEvent>
  /** Event type for quick filtering */
  readonly eventType: string
  /** Tenant identifier for multi-tenant tracking */
  readonly tenantId: string
  /** Aggregate identifier for event sourcing context */
  readonly aggregateId: string
  /** Event timestamp for chronological ordering */
  readonly timestamp: number
  /** Event payload data for detailed inspection */
  readonly payload: any
  /** Event processing metadata */
  readonly metadata: {
    /** Processing duration in milliseconds */
    processingDuration?: number
    /** Event size in bytes */
    eventSize: number
    /** Source system component */
    source: 'game' | 'audio' | 'user' | 'language' | 'system'
    /** Event category for organization */
    category: 'lifecycle' | 'action' | 'state-change' | 'error' | 'security' | 'performance'
  }
}

/**
 * Audit Log Configuration
 * 
 * Controls the behavior and limits of the audit projection.
 */
export interface AuditLogConfig {
  /** Maximum number of events to keep in memory */
  readonly maxEvents: number
  /** Event retention period in milliseconds */
  readonly retentionPeriod: number
  /** Enable automatic cleanup of old events */
  readonly enableCleanup: boolean
  /** Cleanup interval in milliseconds */
  readonly cleanupInterval: number
  /** Enable event size tracking */
  readonly enableSizeTracking: boolean
  /** Enable performance monitoring */
  readonly enablePerformanceMonitoring: boolean
}

/**
 * Audit Statistics
 * 
 * Provides metrics about the audit projection for monitoring.
 */
export interface AuditStatistics {
  /** Total number of events in audit log */
  readonly totalEvents: number
  /** Number of events by tenant */
  readonly eventsByTenant: Record<string, number>
  /** Number of events by type */
  readonly eventsByType: Record<string, number>
  /** Number of events by category */
  readonly eventsByCategory: Record<string, number>
  /** Average event size in bytes */
  readonly averageEventSize: number
  /** Events per second rate */
  readonly eventsPerSecond: number
  /** Memory usage in bytes */
  readonly memoryUsage: number
  /** Oldest event timestamp */
  readonly oldestEventTimestamp: number
  /** Newest event timestamp */
  readonly newestEventTimestamp: number
}

/**
 * Event Filter Options
 * 
 * Provides flexible filtering capabilities for audit log queries.
 */
export interface EventFilter {
  /** Tenant identifier filter */
  tenantId?: string
  /** Event type filter */
  eventType?: string
  /** Event category filter */
  category?: string
  /** Source system filter */
  source?: string
  /** Time range filter */
  timeRange?: {
    readonly start: number
    readonly end: number
  }
  /** Text search filter */
  searchText?: string
  /** Aggregate identifier filter */
  aggregateId?: string
  /** Event size range filter */
  sizeRange?: {
    readonly min: number
    readonly max: number
  }
}

/**
 * Audit Projection Implementation
 * 
 * Maintains a comprehensive audit log of all system events.
 * Provides real-time visibility into system activity across all tenants.
 */
export class AuditProjection {
  private readonly auditLog = new Map<string, AuditLogEntry>()
  private readonly eventBus = createEventBus<GameEvent | AudioEvent | UserEvent>()
  private readonly config: AuditLogConfig
  private cleanupInterval?: NodeJS.Timeout
  private eventCounter = 0
  private lastCleanupTime = Date.now()
  private startTime = Date.now()

  constructor(config: Partial<AuditLogConfig> = {}) {
    this.config = {
      maxEvents: 10000,
      retentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
      enableCleanup: true,
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enableSizeTracking: true,
      enablePerformanceMonitoring: true,
      ...config
    }

    console.log('🔍 [AUDIT] Audit Projection initialized')
    console.log(`  Max events: ${this.config.maxEvents}`)
    console.log(`  Retention period: ${this.config.retentionPeriod}ms`)
    console.log(`  Cleanup enabled: ${this.config.enableCleanup}`)

    this.startEventSubscription()
    this.startCleanupTimer()
  }

  /**
   * Start subscribing to all system events
   */
  private startEventSubscription(): void {
    console.log('🔍 [AUDIT] Starting event subscription')

    // Subscribe to all events from the event bus
    this.eventBus.subscribeAll((event: GameEvent | AudioEvent | UserEvent) => {
      this.processEvent(event)
    })
  }

  /**
   * Process incoming event and add to audit log
   */
  private processEvent(event: GameEvent | AudioEvent | UserEvent): void {
    const startTime = this.config.enablePerformanceMonitoring ? Date.now() : undefined

    try {
      // Create audit log entry
      const auditEntry = this.createAuditLogEntry(event, startTime)
      
      // Add to audit log
      this.addAuditEntry(auditEntry)
      
      // Check if cleanup is needed
      this.checkAndPerformCleanup()
      
      this.eventCounter++

    } catch (error) {
      console.error('🔍 [AUDIT] Error processing event:', error)
    }
  }

  /**
   * Create audit log entry from event
   */
  private createAuditLogEntry(
    event: GameEvent | AudioEvent | UserEvent,
    startTime?: number
  ): AuditLogEntry {
    const timestamp = Date.now()
    const processingDuration = startTime ? timestamp - startTime : undefined
    const eventSize = this.calculateEventSize(event)
    const source = this.determineEventSource(event)
    const category = this.categorizeEvent(event)

    // Create event envelope for audit purposes
    const eventEnvelope: EventEnvelope<GameEvent | AudioEvent | UserEvent> = {
      id: `audit_${timestamp}_${this.eventCounter}`,
      seq: this.eventCounter,
      timestamp,
      tenant_id: this.extractTenantId(event),
      aggregate_id: this.extractAggregateId(event),
      event
    }

    return {
      id: eventEnvelope.id,
      eventEnvelope,
      eventType: event.type,
      tenantId: eventEnvelope.tenant_id,
      aggregateId: eventEnvelope.aggregate_id,
      timestamp: eventEnvelope.timestamp,
      payload: event,
      metadata: {
        processingDuration,
        eventSize,
        source,
        category
      }
    }
  }

  /**
   * Add audit entry to the log
   */
  private addAuditEntry(entry: AuditLogEntry): void {
    this.auditLog.set(entry.id, entry)
    
    // Log event details for debugging
    console.log(`🔍 [AUDIT] Event added: ${entry.eventType} (${entry.tenantId})`)
    console.log(`  Timestamp: ${new Date(entry.timestamp).toISOString()}`)
    console.log(`  Event size: ${entry.metadata.eventSize} bytes`)
    console.log(`  Category: ${entry.metadata.category}`)
  }

  /**
   * Calculate event size in bytes
   */
  private calculateEventSize(event: any): number {
    return new Blob([JSON.stringify(event)]).size
  }

  /**
   * Determine event source system
   */
  private determineEventSource(event: any): 'game' | 'audio' | 'user' | 'language' | 'system' {
    if (event.type?.startsWith('audio/')) return 'audio'
    if (event.type?.startsWith('game/')) return 'game'
    if (event.type?.startsWith('user/')) return 'user'
    if (event.type?.startsWith('language/')) return 'language'
    return 'system'
  }

  /**
   * Categorize event for organization
   */
  private categorizeEvent(event: any): 'lifecycle' | 'action' | 'state-change' | 'error' | 'security' | 'performance' {
    const eventType = event.type
    
    if (eventType?.includes('failed') || eventType?.includes('error')) return 'error'
    if (eventType?.includes('started') || eventType?.includes('finished')) return 'lifecycle'
    if (eventType?.includes('submitted') || eventType?.includes('advanced')) return 'action'
    if (eventType?.includes('updated') || eventType?.includes('changed')) return 'state-change'
    if (eventType?.includes('settings') || eventType?.includes('auth')) return 'security'
    if (eventType?.includes('performance') || eventType?.includes('latency')) return 'performance'
    
    return 'action'
  }

  /**
   * Extract tenant ID from event
   */
  private extractTenantId(event: any): string {
    return event.tenant_id || 'system'
  }

  /**
   * Extract aggregate ID from event
   */
  private extractAggregateId(event: any): string {
    return event.aggregate_id || 'global'
  }

  /**
   * Check and perform cleanup if needed
   */
  private checkAndPerformCleanup(): void {
    if (!this.config.enableCleanup) return

    const now = Date.now()
    const timeSinceLastCleanup = now - this.lastCleanupTime

    // Perform cleanup if interval has passed or max events exceeded
    if (timeSinceLastCleanup > this.config.cleanupInterval || 
        this.auditLog.size > this.config.maxEvents) {
      this.performCleanup()
      this.lastCleanupTime = now
    }
  }

  /**
   * Perform cleanup of old events
   */
  private performCleanup(): void {
    const now = Date.now()
    const cutoffTime = now - this.config.retentionPeriod
    let removedCount = 0

    // Remove events older than retention period
    for (const [id, entry] of this.auditLog) {
      if (entry.timestamp < cutoffTime) {
        this.auditLog.delete(id)
        removedCount++
      }
    }

    // If still too many events, remove oldest ones
    if (this.auditLog.size > this.config.maxEvents) {
      const entries = Array.from(this.auditLog.values())
        .sort((a, b) => a.timestamp - b.timestamp)
      
      const excessCount = this.auditLog.size - this.config.maxEvents
      for (let i = 0; i < excessCount; i++) {
        if (entries[i]?.id) this.auditLog.delete(entries[i]!.id)
        removedCount++
      }
    }

    console.log(`🔍 [AUDIT] Cleanup completed: removed ${removedCount} events`)
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (!this.config.enableCleanup) return

    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Get all audit log entries
   */
  getAllEntries(): readonly AuditLogEntry[] {
    return Array.from(this.auditLog.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get audit log entries with filtering
   */
  getFilteredEntries(filter: EventFilter): readonly AuditLogEntry[] {
    let entries = Array.from(this.auditLog.values())

    // Apply filters
    if (filter.tenantId) {
      entries = entries.filter(e => e.tenantId === filter.tenantId)
    }

    if (filter.eventType) {
      entries = entries.filter(e => e.eventType === filter.eventType)
    }

    if (filter.category) {
      entries = entries.filter(e => e.metadata.category === filter.category)
    }

    if (filter.source) {
      entries = entries.filter(e => e.metadata.source === filter.source)
    }

    if (filter.timeRange) {
      entries = entries.filter(e => 
        e.timestamp >= filter.timeRange!.start && 
        e.timestamp <= filter.timeRange!.end
      )
    }

    if (filter.searchText) {
      const searchText = filter.searchText.toLowerCase()
      entries = entries.filter(e => 
        e.eventType.toLowerCase().includes(searchText) ||
        e.tenantId.toLowerCase().includes(searchText) ||
        JSON.stringify(e.payload).toLowerCase().includes(searchText)
      )
    }

    if (filter.aggregateId) {
      entries = entries.filter(e => e.aggregateId === filter.aggregateId)
    }

    if (filter.sizeRange) {
      entries = entries.filter(e => 
        e.metadata.eventSize >= filter.sizeRange!.min && 
        e.metadata.eventSize <= filter.sizeRange!.max
      )
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get events by tenant
   */
  getEventsByTenant(tenantId: string): readonly AuditLogEntry[] {
    return this.getFilteredEntries({ tenantId })
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): readonly AuditLogEntry[] {
    return this.getAllEntries().slice(0, limit)
  }

  /**
   * Search events by text
   */
  searchEvents(searchText: string): readonly AuditLogEntry[] {
    return this.getFilteredEntries({ searchText })
  }

  /**
   * Get audit statistics
   */
  getStatistics(): AuditStatistics {
    const entries = Array.from(this.auditLog.values())
    const now = Date.now()
    const uptime = now - this.startTime

    // Calculate statistics
    const eventsByTenant: Record<string, number> = {}
    const eventsByType: Record<string, number> = {}
    const eventsByCategory: Record<string, number> = {}

    let totalEventSize = 0
    let oldestTimestamp = now
    let newestTimestamp = 0

    for (const entry of entries) {
      // Count by tenant
      eventsByTenant[entry.tenantId] = (eventsByTenant[entry.tenantId] || 0) + 1

      // Count by type
      eventsByType[entry.eventType] = (eventsByType[entry.eventType] || 0) + 1

      // Count by category
      eventsByCategory[entry.metadata.category] = (eventsByCategory[entry.metadata.category] || 0) + 1

      // Track size
      totalEventSize += entry.metadata.eventSize

      // Track timestamps
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp)
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp)
    }

    const averageEventSize = entries.length > 0 ? totalEventSize / entries.length : 0
    const eventsPerSecond = uptime > 0 ? (entries.length / uptime) * 1000 : 0
    const memoryUsage = new Blob([JSON.stringify(entries)]).size

    return {
      totalEvents: entries.length,
      eventsByTenant,
      eventsByType,
      eventsByCategory,
      averageEventSize,
      eventsPerSecond,
      memoryUsage,
      oldestEventTimestamp: oldestTimestamp,
      newestEventTimestamp: newestTimestamp
    }
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): AuditLogEntry | undefined {
    return this.auditLog.get(id)
  }

  /**
   * Export audit log to JSON
   */
  exportToJSON(filter?: EventFilter): string {
    const entries = filter ? this.getFilteredEntries(filter) : this.getAllEntries()
    return JSON.stringify(entries, null, 2)
  }

  /**
   * Export audit log to CSV
   */
  exportToCSV(filter?: EventFilter): string {
    const entries = filter ? this.getFilteredEntries(filter) : this.getAllEntries()
    
    const headers = [
      'ID', 'Timestamp', 'Tenant ID', 'Aggregate ID', 'Event Type',
      'Source', 'Category', 'Event Size', 'Processing Duration'
    ]

    const rows = entries.map(entry => [
      entry.id,
      new Date(entry.timestamp).toISOString(),
      entry.tenantId,
      entry.aggregateId,
      entry.eventType,
      entry.metadata.source,
      entry.metadata.category,
      entry.metadata.eventSize,
      entry.metadata.processingDuration || ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog.clear()
    this.eventCounter = 0
    console.log('🔍 [AUDIT] Audit log cleared')
  }

  /**
   * Destroy audit projection and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    this.clearAuditLog()
    console.log('🔍 [AUDIT] Audit projection destroyed')
  }
}

/**
 * Create audit projection with default configuration
 */
export function createAuditProjection(config?: Partial<AuditLogConfig>): AuditProjection {
  return new AuditProjection(config)
}

/**
 * Global audit projection instance
 */
export const auditProjection = createAuditProjection()
