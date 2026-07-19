/**
 * Audit entity public API
 */

export type {
  AuditEvent as AuditDomainEvent,
  AuditEventType,
  AuditProjectionStarted,
  AuditEventProcessed,
  AuditMetricsUpdated,
  AuditFilterApplied,
  AuditExportRequested,
  AuditExportCompleted,
} from './events.ts'

export type {
  AuditEvent,
  TenantMetrics,
  EventTypeMetrics,
  SystemMetrics,
  AuditFilter,
  AuditQuery,
  AuditProjectionState,
  DriftCheckResult,
  DriftDetectionConfig,
  AuditReport,
  IntegrityReport,
} from './types.ts'

export { AuditProjection, createAuditProjection } from '../auditProjectionCore.ts'

export {
  queryGameEventLogsByTenant,
  queryGameEventLogsByAggregate,
  countGameEventLogsByAggregate,
  getLastGameEventLog,
  performDriftDetection,
  getTenantActivitySummary,
} from './selectors.ts'

export { AuditProjection as EventAuditor, auditProjection } from './projection.ts'
