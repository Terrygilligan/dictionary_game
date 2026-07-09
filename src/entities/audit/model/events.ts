/**
 * Audit entity events for SuperAdmin Dashboard
 * These events represent the audit system's own operations
 */

export interface AuditProjectionStarted {
  readonly type: 'audit/projection-started'
  readonly timestamp: number
  readonly projection_id: string
}

export interface AuditEventProcessed {
  readonly type: 'audit/event-processed'
  readonly timestamp: number
  readonly original_event_id: string
  readonly original_event_type: string
  readonly tenant_id: string
  readonly processing_time: number
}

export interface AuditMetricsUpdated {
  readonly type: 'audit/metrics-updated'
  readonly timestamp: number
  readonly total_events: number
  readonly active_tenants: number
  readonly error_rate: number
}

export interface AuditFilterApplied {
  readonly type: 'audit/filter-applied'
  readonly timestamp: number
  readonly filter: {
    readonly tenant_id?: string
    readonly event_type?: string
    readonly start_time?: number
    readonly end_time?: number
  }
  readonly result_count: number
}

export interface AuditExportRequested {
  readonly type: 'audit/export-requested'
  readonly timestamp: number
  readonly requested_by: string
  readonly export_format: 'json' | 'csv'
  readonly filter: {
    readonly start_time: number
    readonly end_time: number
  }
}

export interface AuditExportCompleted {
  readonly type: 'audit/export-completed'
  readonly timestamp: number
  readonly export_id: string
  readonly file_size: number
  readonly record_count: number
  readonly processing_time: number
}

export type AuditEvent = 
  | AuditProjectionStarted
  | AuditEventProcessed
  | AuditMetricsUpdated
  | AuditFilterApplied
  | AuditExportRequested
  | AuditExportCompleted

export type AuditEventType = AuditEvent['type']
