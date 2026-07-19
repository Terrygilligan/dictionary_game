/**
 * Audit entity types for SuperAdmin Dashboard
 * Provides read-optimized projections for event visualization and analytics
 */

export interface AuditEvent {
  readonly id: string
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly aggregate_type: 'user' | 'game' | 'village'
  readonly event_type: string
  readonly timestamp: number
  readonly sequence: number
  readonly metadata: Record<string, unknown>
  readonly processed_at: number
}

export interface TenantMetrics {
  readonly tenant_id: string
  readonly event_count: number
  readonly last_activity: number
  readonly user_count: number
  readonly game_sessions: number
  readonly error_count: number
  readonly created_at: number
}

export interface EventTypeMetrics {
  readonly event_type: string
  readonly count: number
  readonly first_seen: number
  readonly last_seen: number
  readonly error_rate: number
  readonly avg_processing_time: number
}

export interface SystemMetrics {
  readonly total_events: number
  readonly total_tenants: number
  readonly active_tenants: number
  readonly error_rate: number
  readonly events_per_second: number
  readonly last_updated: number
  readonly top_event_types: readonly EventTypeMetrics[]
  readonly tenant_metrics: readonly TenantMetrics[]
}

export interface AuditFilter {
  readonly tenant_id?: string
  readonly aggregate_type?: string
  readonly event_type?: string
  readonly start_time?: number
  readonly end_time?: number
  readonly limit?: number
  readonly offset?: number
}

export interface AuditQuery {
  readonly filter: AuditFilter
  readonly sort_by: 'timestamp' | 'sequence' | 'event_type'
  readonly sort_direction: 'asc' | 'desc'
}

export interface AuditProjectionState {
  readonly events: readonly AuditEvent[]
  readonly metrics: SystemMetrics
  readonly is_loading: boolean
  readonly last_updated: number
  readonly subscription_active: boolean
}

/**
 * Drift Detection Types
 * 
 * Enables integrity checking of event logs by comparing
 * event counts against sequence numbers to detect missing or malformed events.
 */

export interface DriftCheckResult extends Record<string, unknown> {
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly event_count: number
  readonly expected_sequence: number
  readonly has_drift: boolean
  readonly drift_amount: number
  readonly checked_at: number
  readonly last_event_sequence?: number
  readonly missing_sequences?: number[]
}

export interface DriftDetectionConfig {
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly auto_repair?: boolean
}

export interface AuditReport {
  readonly id: string
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly report_type: 'integrity' | 'metrics' | 'activity'
  readonly data: Record<string, unknown>
  readonly generated_at: number
  readonly generated_by: 'system' | 'user'
}

export interface IntegrityReport extends AuditReport {
  readonly report_type: 'integrity'
  readonly data: DriftCheckResult
}
