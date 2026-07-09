/**
 * Audit Selectors
 * 
 * Provides query functions and selectors for the audit projection.
 * Enables the SuperAdmin dashboard to access and filter audit data
 * with various query patterns and aggregation capabilities.
 * 
 * Following Event-Driven Architecture Blueprint:
 * - Projection Query: Provides efficient access to audit data
 * - Multi-Tenant: Supports tenant-specific and cross-tenant queries
 * - Immutable: Pure functions with no side effects
 * - Performance: Optimized for real-time dashboard queries
 */

import type { AuditLogEntry, EventFilter, AuditStatistics } from './auditProjection.ts'
import { auditProjection } from './auditProjection.ts'

/**
 * Event Aggregation Options
 * 
 * Controls how events are aggregated for dashboard views.
 */
export interface AggregationOptions {
  /** Time window for aggregation */
  timeWindow?: {
    readonly start: number
    readonly end: number
  }
  /** Group by field */
  groupBy?: 'tenant' | 'eventType' | 'category' | 'source' | 'hour' | 'day'
  /** Aggregation functions */
  aggregations?: Array<'count' | 'avgSize' | 'maxSize' | 'minSize' | 'totalSize'>
}

/**
 * Aggregated Event Data
 * 
 * Result of event aggregation operations.
 */
export interface AggregatedEventData {
  /** Group key */
  readonly key: string
  /** Event count */
  readonly count: number
  /** Average event size */
  readonly avgSize: number
  /** Maximum event size */
  readonly maxSize: number
  /** Minimum event size */
  readonly minSize: number
  /** Total event size */
  readonly totalSize: number
  /** First event timestamp */
  readonly firstTimestamp: number
  /** Last event timestamp */
  readonly lastTimestamp: number
}

/**
 * Dashboard Metrics
 * 
 * High-level metrics for the SuperAdmin dashboard.
 */
export interface DashboardMetrics {
  /** Total events in time window */
  readonly totalEvents: number
  /** Active tenants */
  readonly activeTenants: number
  /** Events per second */
  readonly eventsPerSecond: number
  /** Average event size */
  readonly averageEventSize: number
  /** Error rate percentage */
  readonly errorRate: number
  /** Top event types */
  readonly topEventTypes: Array<{ type: string; count: number }>
  /** Top tenants by activity */
  readonly topTenants: Array<{ tenantId: string; count: number }>
  /** Recent error events */
  readonly recentErrors: readonly AuditLogEntry[]
  /** System health indicators */
  readonly systemHealth: {
    readonly status: 'healthy' | 'warning' | 'critical'
    readonly issues: string[]
    readonly recommendations: string[]
  }
}

/**
 * Time Series Data Point
 * 
 * Represents a single point in time series data.
 */
export interface TimeSeriesDataPoint {
  /** Timestamp */
  readonly timestamp: number
  /** Event count */
  readonly count: number
  /** Unique tenants */
  readonly uniqueTenants: number
  /** Error count */
  readonly errorCount: number
  /** Average size */
  readonly avgSize: number
}

/**
 * Audit Selectors Implementation
 * 
 * Provides comprehensive query capabilities for audit data.
 */
export class AuditSelectors {
  private readonly projection = auditProjection

  /**
   * Get events by tenant ID
   */
  getEventsByTenant(tenantId: string): readonly AuditLogEntry[] {
    return this.projection.getEventsByTenant(tenantId)
  }

  /**
   * Get recent events with optional limit
   */
  getRecentEvents(limit: number = 100): readonly AuditLogEntry[] {
    return this.projection.getRecentEvents(limit)
  }

  /**
   * Search events by text
   */
  searchEvents(searchText: string): readonly AuditLogEntry[] {
    return this.projection.searchEvents(searchText)
  }

  /**
   * Get events with advanced filtering
   */
  getFilteredEvents(filter: EventFilter): readonly AuditLogEntry[] {
    return this.projection.getFilteredEntries(filter)
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(start: number, end: number): readonly AuditLogEntry[] {
    return this.getFilteredEvents({
      timeRange: { start, end }
    })
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: string): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ category })
  }

  /**
   * Get events by source system
   */
  getEventsBySource(source: string): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ source })
  }

  /**
   * Get error events
   */
  getErrorEvents(): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ category: 'error' })
  }

  /**
   * Get security events
   */
  getSecurityEvents(): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ category: 'security' })
  }

  /**
   * Get performance events
   */
  getPerformanceEvents(): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ category: 'performance' })
  }

  /**
   * Get lifecycle events
   */
  getLifecycleEvents(): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ category: 'lifecycle' })
  }

  /**
   * Get events by aggregate ID
   */
  getEventsByAggregate(aggregateId: string): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ aggregateId })
  }

  /**
   * Get events by size range
   */
  getEventsBySizeRange(min: number, max: number): readonly AuditLogEntry[] {
    return this.getFilteredEvents({ sizeRange: { min, max } })
  }

  /**
   * Aggregate events by specified criteria
   */
  aggregateEvents(options: AggregationOptions = {}): readonly AggregatedEventData[] {
    let events = this.projection.getAllEntries()

    // Apply time window filter
    if (options.timeWindow) {
      events = events.filter(e => 
        e.timestamp >= options.timeWindow!.start && 
        e.timestamp <= options.timeWindow!.end
      )
    }

    // Group events
    const groups = new Map<string, AuditLogEntry[]>()

    for (const event of events) {
      let key: string

      switch (options.groupBy) {
        case 'tenant':
          key = event.tenantId
          break
        case 'eventType':
          key = event.eventType
          break
        case 'category':
          key = event.metadata.category
          break
        case 'source':
          key = event.metadata.source
          break
        case 'hour':
          key = new Date(event.timestamp).toISOString().substring(0, 13) // YYYY-MM-DDTHH
          break
        case 'day':
          key = new Date(event.timestamp).toISOString().substring(0, 10) // YYYY-MM-DD
          break
        default:
          key = event.tenantId
      }

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(event)
    }

    // Calculate aggregations
    const results: AggregatedEventData[] = []

    for (const [key, groupEvents] of groups) {
      const sizes = groupEvents.map(e => e.metadata.eventSize)
      const timestamps = groupEvents.map(e => e.timestamp)

      const result: AggregatedEventData = {
        key,
        count: groupEvents.length,
        avgSize: sizes.reduce((sum, size) => sum + size, 0) / sizes.length,
        maxSize: Math.max(...sizes),
        minSize: Math.min(...sizes),
        totalSize: sizes.reduce((sum, size) => sum + size, 0),
        firstTimestamp: Math.min(...timestamps),
        lastTimestamp: Math.max(...timestamps)
      }

      results.push(result)
    }

    return results.sort((a, b) => b.count - a.count)
  }

  /**
   * Get time series data for dashboard charts
   */
  getTimeSeriesData(
    start: number,
    end: number,
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ): readonly TimeSeriesDataPoint[] {
    const events = this.getEventsByTimeRange(start, end)
    const points = new Map<number, TimeSeriesDataPoint>()

    // Calculate interval in milliseconds
    const intervalMs = interval === 'minute' ? 60 * 1000 :
                      interval === 'hour' ? 60 * 60 * 1000 :
                      24 * 60 * 60 * 1000

    // Group events by time intervals
    for (const event of events) {
      const timestamp = Math.floor(event.timestamp / intervalMs) * intervalMs

      if (!points.has(timestamp)) {
        points.set(timestamp, {
          timestamp,
          count: 0,
          uniqueTenants: 0,
          errorCount: 0,
          avgSize: 0
        })
      }

      const point = points.get(timestamp)!
      point.count++
      
      if (event.metadata.category === 'error') {
        point.errorCount++
      }
    }

    // Calculate unique tenants and average sizes
    for (const point of points.values()) {
      const pointEvents = events.filter(e => {
        const pointTimestamp = Math.floor(e.timestamp / intervalMs) * intervalMs
        return pointTimestamp === point.timestamp
      })

      point.uniqueTenants = new Set(pointEvents.map(e => e.tenantId)).size
      point.avgSize = pointEvents.reduce((sum, e) => sum + e.metadata.eventSize, 0) / pointEvents.length
    }

    return Array.from(points.values()).sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics(timeWindow?: { start: number; end: number }): DashboardMetrics {
    const now = Date.now()
    const window = timeWindow || { 
      start: now - 60 * 60 * 1000, // Last hour
      end: now 
    }

    const events = this.getEventsByTimeRange(window.start, window.end)
    const errorEvents = events.filter(e => e.metadata.category === 'error')
    const totalEvents = events.length
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0

    // Calculate events per second
    const timeSpan = (window.end - window.start) / 1000 // Convert to seconds
    const eventsPerSecond = timeSpan > 0 ? totalEvents / timeSpan : 0

    // Get unique tenants
    const uniqueTenants = new Set(events.map(e => e.tenantId)).size

    // Calculate average event size
    const averageEventSize = totalEvents > 0 ? 
      events.reduce((sum, e) => sum + e.metadata.eventSize, 0) / totalEvents : 0

    // Get top event types
    const eventTypeCounts = new Map<string, number>()
    for (const event of events) {
      eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1)
    }

    const topEventTypes = Array.from(eventTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }))

    // Get top tenants by activity
    const tenantCounts = new Map<string, number>()
    for (const event of events) {
      tenantCounts.set(event.tenantId, (tenantCounts.get(event.tenantId) || 0) + 1)
    }

    const topTenants = Array.from(tenantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tenantId, count]) => ({ tenantId, count }))

    // Get recent errors
    const recentErrors = errorEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)

    // Determine system health
    const health = this.determineSystemHealth(errorRate, eventsPerSecond, averageEventSize)

    return {
      totalEvents,
      activeTenants: uniqueTenants,
      eventsPerSecond,
      averageEventSize,
      errorRate,
      topEventTypes,
      topTenants,
      recentErrors,
      systemHealth: health
    }
  }

  /**
   * Determine system health status
   */
  private determineSystemHealth(
    errorRate: number,
    eventsPerSecond: number,
    averageEventSize: number
  ): DashboardMetrics['systemHealth'] {
    const issues: string[] = []
    const recommendations: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check error rate
    if (errorRate > 10) {
      status = 'critical'
      issues.push(`High error rate: ${errorRate.toFixed(2)}%`)
      recommendations.push('Investigate recent error events and fix underlying issues')
    } else if (errorRate > 5) {
      status = 'warning'
      issues.push(`Elevated error rate: ${errorRate.toFixed(2)}%`)
      recommendations.push('Monitor error trends and address recurring issues')
    }

    // Check event rate
    if (eventsPerSecond > 1000) {
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`High event rate: ${eventsPerSecond.toFixed(2)} events/sec`)
      recommendations.push('Consider scaling event processing infrastructure')
    } else if (eventsPerSecond < 0.1) {
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`Low event rate: ${eventsPerSecond.toFixed(2)} events/sec`)
      recommendations.push('Check if system is functioning normally')
    }

    // Check event size
    if (averageEventSize > 1024 * 1024) { // 1MB
      status = status === 'critical' ? 'critical' : 'warning'
      issues.push(`Large average event size: ${(averageEventSize / 1024).toFixed(2)}KB`)
      recommendations.push('Optimize event payload sizes to improve performance')
    }

    return { status, issues, recommendations }
  }

  /**
   * Get tenant activity summary
   */
  getTenantActivitySummary(): Array<{
    tenantId: string
    totalEvents: number
    recentEvents: number
    lastActivity: number
    topEventTypes: Array<{ type: string; count: number }>
    errorCount: number
  }> {
    const now = Date.now()
    const recentThreshold = now - 60 * 60 * 1000 // Last hour
    const allEvents = this.projection.getAllEntries()

    // Group by tenant
    const tenantGroups = new Map<string, AuditLogEntry[]>()

    for (const event of allEvents) {
      if (!tenantGroups.has(event.tenantId)) {
        tenantGroups.set(event.tenantId, [])
      }
      tenantGroups.get(event.tenantId)!.push(event)
    }

    const summaries = []

    for (const [tenantId, events] of tenantGroups) {
      const recentEvents = events.filter(e => e.timestamp >= recentThreshold)
      const lastActivity = Math.max(...events.map(e => e.timestamp))
      const errorCount = events.filter(e => e.metadata.category === 'error').length

      // Get top event types for this tenant
      const eventTypeCounts = new Map<string, number>()
      for (const event of events) {
        eventTypeCounts.set(event.eventType, (eventTypeCounts.get(event.eventType) || 0) + 1)
      }

      const topEventTypes = Array.from(eventTypeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count }))

      summaries.push({
        tenantId,
        totalEvents: events.length,
        recentEvents: recentEvents.length,
        lastActivity,
        topEventTypes,
        errorCount
      })
    }

    return summaries.sort((a, b) => b.recentEvents - a.recentEvents)
  }

  /**
   * Get event type distribution
   */
  getEventTypeDistribution(): Array<{
    type: string
    count: number
    percentage: number
    category: string
    avgSize: number
  }> {
    const events = this.projection.getAllEntries()
    const typeGroups = new Map<string, AuditLogEntry[]>()

    for (const event of events) {
      if (!typeGroups.has(event.eventType)) {
        typeGroups.set(event.eventType, [])
      }
      typeGroups.get(event.eventType)!.push(event)
    }

    const totalEvents = events.length
    const distribution = []

    for (const [type, typeEvents] of typeGroups) {
      const count = typeEvents.length
      const percentage = (count / totalEvents) * 100
      const category = typeEvents[0].metadata.category
      const avgSize = typeEvents.reduce((sum, e) => sum + e.metadata.eventSize, 0) / typeEvents.length

      distribution.push({
        type,
        count,
        percentage,
        category,
        avgSize
      })
    }

    return distribution.sort((a, b) => b.count - a.count)
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    avgProcessingDuration: number
    maxProcessingDuration: number
    minProcessingDuration: number
    totalProcessingTime: number
    eventsWithProcessingTime: number
  } {
    const events = this.projection.getAllEntries()
    const eventsWithDuration = events.filter(e => e.metadata.processingDuration !== undefined)

    if (eventsWithDuration.length === 0) {
      return {
        avgProcessingDuration: 0,
        maxProcessingDuration: 0,
        minProcessingDuration: 0,
        totalProcessingTime: 0,
        eventsWithProcessingTime: 0
      }
    }

    const durations = eventsWithDuration.map(e => e.metadata.processingDuration!)
    const totalProcessingTime = durations.reduce((sum, duration) => sum + duration, 0)

    return {
      avgProcessingDuration: totalProcessingTime / durations.length,
      maxProcessingDuration: Math.max(...durations),
      minProcessingDuration: Math.min(...durations),
      totalProcessingTime,
      eventsWithProcessingTime: eventsWithDuration.length
    }
  }

  /**
   * Export audit data in various formats
   */
  exportData(format: 'json' | 'csv', filter?: EventFilter): string {
    if (format === 'json') {
      return this.projection.exportToJSON(filter)
    } else {
      return this.projection.exportToCSV(filter)
    }
  }

  /**
   * Get audit statistics
   */
  getStatistics(): AuditStatistics {
    return this.projection.getStatistics()
  }
}

/**
 * Create audit selectors instance
 */
export function createAuditSelectors(): AuditSelectors {
  return new AuditSelectors()
}

/**
 * Global audit selectors instance
 */
export const auditSelectors = createAuditSelectors()
