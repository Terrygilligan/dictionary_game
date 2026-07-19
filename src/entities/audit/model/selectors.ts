/**
 * Audit Selectors - Tenant-Scoped Event Log Queries
 * 
 * Provides read-only query functions for accessing game_event_logs collection
 * with strict tenant isolation. All queries are scoped by tenant_id to prevent
 * cross-tenant data leakage.
 * 
 * Architectural Compliance:
 * - Read-Only: Never modifies game_event_logs collection
 * - Tenant Isolation: All queries scoped by tenant_id
 * - Event-Sourced: Works with immutable event log structure
 * - Pure Functions: No side effects, deterministic queries
 */

import { getFirestoreDB } from '@/shared/api/firebase'
import { collection, query, where, orderBy, limit, getDocs, QueryDocumentSnapshot } from 'firebase/firestore'
import type { DriftCheckResult } from './types'

/**
 * Game Event Log Document Schema
 * Matches the structure written by GameAuditService
 */
export interface GameEventLogDocument {
  readonly auditId: string
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly correlationId: string
  readonly type: string
  readonly timestamp: number
  readonly seq?: number
  readonly projectedAt?: any
  readonly [key: string]: unknown
}

/**
 * Query game event logs for a specific tenant
 * 
 * @param tenant_id - The tenant ID to scope the query
 * @param options - Optional query parameters (limit, event type filter)
 * @returns Array of game event log documents
 */
export async function queryGameEventLogsByTenant(
  tenant_id: string,
  options?: {
    limit?: number
    event_type?: string
    start_time?: number
    end_time?: number
  }
): Promise<GameEventLogDocument[]> {
  const db = getFirestoreDB()
  const eventLogsCollection = collection(db, 'game_event_logs')
  
  // Build query with tenant isolation
  let q = query(eventLogsCollection, where('tenant_id', '==', tenant_id))
  
  // Add optional filters
  if (options?.event_type) {
    q = query(q, where('type', '==', options.event_type))
  }
  
  if (options?.start_time) {
    q = query(q, where('timestamp', '>=', options.start_time))
  }
  
  if (options?.end_time) {
    q = query(q, where('timestamp', '<=', options.end_time))
  }
  
  // Order by timestamp and apply limit
  q = query(q, orderBy('timestamp', 'desc'))
  if (options?.limit) {
    q = query(q, limit(options.limit))
  }
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as GameEventLogDocument)
}

/**
 * Query game event logs for a specific aggregate (game session)
 * 
 * @param tenant_id - The tenant ID to scope the query
 * @param aggregate_id - The aggregate ID (game session ID)
 * @param options - Optional query parameters
 * @returns Array of game event log documents for the aggregate
 */
export async function queryGameEventLogsByAggregate(
  tenant_id: string,
  aggregate_id: string,
  options?: {
    limit?: number
  }
): Promise<GameEventLogDocument[]> {
  const db = getFirestoreDB()
  const eventLogsCollection = collection(db, 'game_event_logs')
  
  // Build query with tenant and aggregate isolation
  let q = query(
    eventLogsCollection,
    where('tenant_id', '==', tenant_id),
    where('aggregate_id', '==', aggregate_id)
  )
  
  // Order by timestamp and apply limit
  q = query(q, orderBy('timestamp', 'asc'))
  if (options?.limit) {
    q = query(q, limit(options.limit))
  }
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as GameEventLogDocument)
}

/**
 * Count game event logs for a specific aggregate
 * Used for drift detection to compare against sequence numbers
 * 
 * @param tenant_id - The tenant ID to scope the query
 * @param aggregate_id - The aggregate ID (game session ID)
 * @returns Number of events in the log for this aggregate
 */
export async function countGameEventLogsByAggregate(
  tenant_id: string,
  aggregate_id: string
): Promise<number> {
  const events = await queryGameEventLogsByAggregate(tenant_id, aggregate_id)
  return events.length
}

/**
 * Get the last event in the log for an aggregate
 * Used for drift detection to extract the sequence number
 * 
 * @param tenant_id - The tenant ID to scope the query
 * @param aggregate_id - The aggregate ID (game session ID)
 * @returns The last event document or null if no events exist
 */
export async function getLastGameEventLog(
  tenant_id: string,
  aggregate_id: string
): Promise<GameEventLogDocument | null> {
  const events = await queryGameEventLogsByAggregate(tenant_id, aggregate_id, { limit: 1 })
  return events.length > 0 ? events[0]! : null
}

/**
 * Perform drift detection on an aggregate's event log
 * Compares the count of events against the sequence number of the last event
 * 
 * @param tenant_id - The tenant ID to scope the check
 * @param aggregate_id - The aggregate ID (game session ID)
 * @returns Drift check result with integrity status
 */
export async function performDriftDetection(
  tenant_id: string,
  aggregate_id: string
): Promise<DriftCheckResult> {
  console.log(`🔍 [AUDIT_DRIFT] Starting drift detection for tenant: ${tenant_id}, aggregate: ${aggregate_id}`)
  
  const eventCount = await countGameEventLogsByAggregate(tenant_id, aggregate_id)
  const lastEvent = await getLastGameEventLog(tenant_id, aggregate_id)
  
  const lastSequence = lastEvent?.seq ?? 0
  const expectedSequence = lastSequence
  const hasDrift = eventCount !== expectedSequence
  const driftAmount = Math.abs(eventCount - expectedSequence)
  
  // Calculate missing sequences if drift detected
  let missingSequences: number[] = []
  if (hasDrift && eventCount < expectedSequence) {
    // Fetch all events to identify missing sequences
    const allEvents = await queryGameEventLogsByAggregate(tenant_id, aggregate_id)
    const sequences = allEvents
      .map(e => e.seq)
      .filter((seq): seq is number => seq !== undefined)
      .sort((a, b) => a - b)
    
    // Identify gaps in the sequence
    for (let i = 1; i <= expectedSequence; i++) {
      if (!sequences.includes(i)) {
        missingSequences.push(i)
      }
    }
  }
  
  const result: DriftCheckResult = {
    tenant_id,
    aggregate_id,
    event_count: eventCount,
    expected_sequence: expectedSequence,
    has_drift: hasDrift,
    drift_amount: driftAmount,
    checked_at: Date.now(),
    last_event_sequence: lastSequence,
    missing_sequences: missingSequences.length > 0 ? missingSequences : undefined,
  }
  
  if (hasDrift) {
    console.error(`⚠️ [SYSTEM_DRIFT_DETECTED] Drift detected for tenant: ${tenant_id}, aggregate: ${aggregate_id}`, {
      eventCount,
      expectedSequence,
      driftAmount,
      missingSequences,
    })
  } else {
    console.log(`✅ [AUDIT_DRIFT] No drift detected for tenant: ${tenant_id}, aggregate: ${aggregate_id}`)
  }
  
  return result
}

/**
 * Get tenant activity summary
 * Aggregates event counts and metrics for a specific tenant
 * 
 * @param tenant_id - The tenant ID to scope the query
 * @returns Tenant activity metrics
 */
export async function getTenantActivitySummary(tenant_id: string): Promise<{
  total_events: number
  unique_aggregates: number
  last_activity: number | null
  event_types: Record<string, number>
}> {
  const events = await queryGameEventLogsByTenant(tenant_id, { limit: 1000 })
  
  const uniqueAggregates = new Set(events.map(e => e.aggregate_id)).size
  const eventTypes: Record<string, number> = {}
  
  for (const event of events) {
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1
  }
  
  const lastActivity = events.length > 0 
    ? Math.max(...events.map(e => e.timestamp))
    : null
  
  return {
    total_events: events.length,
    unique_aggregates: uniqueAggregates,
    last_activity: lastActivity,
    event_types: eventTypes,
  }
}
