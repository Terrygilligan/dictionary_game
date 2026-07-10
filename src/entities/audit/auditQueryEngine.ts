/**
 * Audit Query Engine - High-Performance Selectors for Event Stream Analysis
 * 
 * This module provides optimized query functions for the SuperAdmin Dashboard.
 * All selectors are pure functions that operate on the AuditLog structure,
 * providing fast access to filtered and sorted event data.
 * 
 * Architecture Note: These selectors are READ-ONLY and never mutate state.
 * They're designed for high-performance queries on large event streams.
 */

import type { AuditLog, AuditLogEntry } from './auditProjectionCore.ts'

/**
 * Filter interface for event queries
 * Provides flexible filtering options for the dashboard
 */
export interface EventFilter {
  /** Filter by specific tenant ID */
  tenantId?: string
  /** Filter by specific event type */
  eventType?: string
  /** Filter by event type pattern (wildcard support) */
  eventTypePattern?: string
  /** Filter by time range */
  timeRange?: {
    start: number
    end: number
  }
  /** Filter by aggregate ID */
  aggregateId?: string
  /** Search in event payload */
  searchText?: string
  /** Limit number of results */
  limit?: number
  /** Offset for pagination */
  offset?: number
}

/**
 * Sort options for event queries
 */
export interface SortOptions {
  /** Field to sort by */
  field: 'timestamp' | 'eventType' | 'tenantId' | 'aggregateId'
  /** Sort direction */
  direction: 'asc' | 'desc'
}

/**
 * Query result with pagination metadata
 */
export interface QueryResult<T> {
  /** Query results */
  items: T[]
  /** Total number of items matching the filter */
  total: number
  /** Whether there are more items available */
  hasMore: boolean
  /** Query execution metadata */
  metadata: {
    executionTime: number
    filterApplied: boolean
    sortApplied: boolean
  }
}

/**
 * High-performance query engine for audit events
 */
export class AuditQueryEngine {
  /**
   * Get all events for a specific tenant
   * Optimized with direct index lookup
   */
  static getEventsByTenant(auditLog: AuditLog, tenantId: string, options?: { limit?: number }): QueryResult<AuditLogEntry> {
    const startTime = performance.now()
    
    const entries = auditLog.byTenant.get(tenantId) || []
    const limited = options?.limit ? [...entries].slice(0, options.limit) : [...entries]
    
    return {
      items: limited,
      total: entries.length,
      hasMore: options?.limit ? entries.length > options.limit : false,
      metadata: {
        executionTime: performance.now() - startTime,
        filterApplied: true,
        sortApplied: false,
      }
    }
  }

  /**
   * Get recent events across all tenants
   * Uses the pre-computed recent events index for optimal performance
   */
  static getRecentEvents(auditLog: AuditLog, limit: number = 100): QueryResult<AuditLogEntry> {
    const startTime = performance.now()
    
    const recent = auditLog.recent.slice(0, limit)
    
    return {
      items: recent,
      total: auditLog.recent.length,
      hasMore: auditLog.recent.length > limit,
      metadata: {
        executionTime: performance.now() - startTime,
        filterApplied: false,
        sortApplied: false,
      }
    }
  }

  /**
   * Search events with flexible filtering
   * The main workhorse for dashboard queries
   */
  static searchEvents(auditLog: AuditLog, filter: EventFilter, sort?: SortOptions): QueryResult<AuditLogEntry> {
    const startTime = performance.now()
    
    let candidates: AuditLogEntry[] = auditLog.entries as AuditLogEntry[]
    
    // Apply tenant filter
    if (filter.tenantId) {
      candidates = candidates.filter(entry => entry.tenantId === filter.tenantId)
    }
    
    // Apply event type filter
    if (filter.eventType) {
      candidates = candidates.filter(entry => entry.eventType === filter.eventType)
    }
    
    // Apply event type pattern filter (wildcard)
    if (filter.eventTypePattern) {
      const pattern = filter.eventTypePattern.replace('*', '.*')
      const regex = new RegExp(pattern, 'i')
      candidates = candidates.filter(entry => regex.test(entry.eventType))
    }
    
    // Apply time range filter
    if (filter.timeRange) {
      candidates = candidates.filter(entry => 
        entry.timestamp >= filter.timeRange!.start && 
        entry.timestamp <= filter.timeRange!.end
      )
    }
    
    // Apply aggregate ID filter
    if (filter.aggregateId) {
      candidates = candidates.filter(entry => entry.aggregateId === filter.aggregateId)
    }
    
    // Apply search text filter (searches in payload)
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase()
      candidates = candidates.filter(entry => {
        // Search in event type
        if (entry.eventType.toLowerCase().includes(searchLower)) {
          return true
        }
        
        // Search in tenant ID
        if (entry.tenantId.toLowerCase().includes(searchLower)) {
          return true
        }
        
        // Search in aggregate ID
        if (entry.aggregateId.toLowerCase().includes(searchLower)) {
          return true
        }
        
        // Search in payload (stringified)
        const payloadStr = JSON.stringify(entry.payload).toLowerCase()
        return payloadStr.includes(searchLower)
      })
    }
    
    // Apply sorting
    if (sort) {
      candidates = this.sortEntries(candidates, sort)
    }
    
    // Apply pagination
    const total = candidates.length
    const offset = filter.offset || 0
    const limit = filter.limit || 100
    const paginated = candidates.slice(offset, offset + limit)
    
    return {
      items: paginated,
      total,
      hasMore: offset + limit < total,
      metadata: {
        executionTime: performance.now() - startTime,
        filterApplied: true,
        sortApplied: !!sort,
      }
    }
  }

  /**
   * Get events by specific event type
   * Uses the pre-computed event type index
   */
  static getEventsByType(auditLog: AuditLog, eventType: string, options?: { limit?: number }): QueryResult<AuditLogEntry> {
    const startTime = performance.now()
    
    const entries = auditLog.byEventType.get(eventType) || []
    const limited = options?.limit ? [...entries].slice(0, options.limit) : [...entries]
    
    return {
      items: limited,
      total: entries.length,
      hasMore: options?.limit ? entries.length > options.limit : false,
      metadata: {
        executionTime: performance.now() - startTime,
        filterApplied: true,
        sortApplied: false,
      }
    }
  }

  /**
   * Get event statistics for dashboard metrics
   */
  static getEventStatistics(auditLog: AuditLog) {
    const stats = auditLog.stats
    
    // Calculate event type distribution
    const eventTypeDistribution = new Map<string, number>()
    for (const [eventType, entries] of auditLog.byEventType) {
      eventTypeDistribution.set(eventType, entries.length)
    }
    
    // Calculate tenant activity distribution
    const tenantActivity = new Map<string, number>()
    for (const [tenantId, entries] of auditLog.byTenant) {
      tenantActivity.set(tenantId, entries.length)
    }
    
    // Get top event types
    const topEventTypes = Array.from(eventTypeDistribution.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))
    
    // Get top active tenants
    const topActiveTenants = Array.from(tenantActivity.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tenantId, count]) => ({ tenantId, count }))
    
    return {
      totalEvents: stats.totalEvents,
      totalTenants: stats.totalTenants,
      eventsPerSecond: stats.eventsPerSecond,
      oldestEvent: stats.oldestEvent,
      newestEvent: stats.newestEvent,
      eventTypeDistribution,
      tenantActivity,
      topEventTypes,
      topActiveTenants,
    }
  }

  /**
   * Get error events for system health monitoring
   */
  static getErrorEvents(auditLog: AuditLog, options?: { limit?: number }): QueryResult<AuditLogEntry> {
    const startTime = performance.now()
    
    // Filter for error-related events
    const errorEvents = (auditLog.entries as AuditLogEntry[]).filter(entry => 
      entry.eventType.includes('error') ||
      entry.eventType.includes('failed') ||
      entry.eventType.includes('exception')
    )
    
    const limited = options?.limit ? errorEvents.slice(0, options.limit) : errorEvents
    
    return {
      items: limited,
      total: errorEvents.length,
      hasMore: options?.limit ? errorEvents.length > options.limit : false,
      metadata: {
        executionTime: performance.now() - startTime,
        filterApplied: true,
        sortApplied: false,
      }
    }
  }

  /**
   * Get performance metrics for specific time windows
   */
  static getPerformanceMetrics(auditLog: AuditLog, timeWindowMs: number = 300000) { // 5 minutes default
    const now = Date.now()
    const windowStart = now - timeWindowMs
    
    // Get events in the time window
    const recentEvents = auditLog.entries.filter(entry => entry.timestamp >= windowStart)
    
    // Calculate metrics
    const eventsPerSecond = recentEvents.length / (timeWindowMs / 1000)
    
    // Group by event type for distribution
    const typeDistribution = new Map<string, number>()
    for (const entry of recentEvents) {
      const count = typeDistribution.get(entry.eventType) || 0
      typeDistribution.set(entry.eventType, count + 1)
    }
    
    return {
      timeWindow: timeWindowMs,
      eventCount: recentEvents.length,
      eventsPerSecond,
      typeDistribution,
      windowStart,
      windowEnd: now,
    }
  }

  /**
   * Sort audit entries based on specified criteria
   */
  private static sortEntries(entries: AuditLogEntry[], sort: SortOptions): AuditLogEntry[] {
    const sorted = [...entries]
    
    sorted.sort((a, b) => {
      let aValue: unknown
      let bValue: unknown
      
      switch (sort.field) {
        case 'timestamp':
          aValue = a.timestamp as number
          bValue = b.timestamp as number
          break
        case 'eventType':
          aValue = a.eventType as string
          bValue = b.eventType as string
          break
        case 'tenantId':
          aValue = a.tenantId as string
          bValue = b.tenantId as string
          break
        case 'aggregateId':
          aValue = a.aggregateId as string
          bValue = b.aggregateId as string
          break
        default:
          return 0
      }
      
      if ((aValue as string | number) < (bValue as string | number)) {
        return sort.direction === 'asc' ? -1 : 1
      }
      if ((aValue as string | number) > (bValue as string | number)) {
        return sort.direction === 'asc' ? 1 : -1
      }
      return 0
    })
    
    return sorted
  }
}

/**
 * Convenience selector functions for common dashboard queries
 * These provide a simpler API for the most frequently used queries
 */

/**
 * Get the latest events across all tenants
 */
export function getLatestEvents(auditLog: AuditLog, limit: number = 50) {
  return AuditQueryEngine.getRecentEvents(auditLog, limit)
}

/**
 * Get events for a specific user/tenant
 */
export function getTenantEvents(auditLog: AuditLog, tenantId: string, limit?: number) {
  return AuditQueryEngine.getEventsByTenant(auditLog, tenantId, { limit })
}

/**
 * Search events with text filter
 */
export function searchEventsByText(auditLog: AuditLog, searchText: string, limit?: number) {
  return AuditQueryEngine.searchEvents(auditLog, { searchText, limit })
}

/**
 * Get events by type pattern (supports wildcards)
 */
export function getEventsByTypePattern(auditLog: AuditLog, pattern: string, limit?: number) {
  return AuditQueryEngine.searchEvents(auditLog, { eventTypePattern: pattern, limit })
}

/**
 * Get system health metrics
 */
export function getSystemHealth(auditLog: AuditLog) {
  const stats = AuditQueryEngine.getEventStatistics(auditLog)
  const errors = AuditQueryEngine.getErrorEvents(auditLog, { limit: 100 })
  const performance = AuditQueryEngine.getPerformanceMetrics(auditLog)
  
  return {
    ...stats,
    errorCount: errors.total,
    recentErrors: errors.items,
    performance,
  }
}
