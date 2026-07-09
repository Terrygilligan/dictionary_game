import type { AuditEvent, AuditProjectionState, SystemMetrics } from '../../../entities/audit/model/index.ts'
import type { AuditProjectionService } from '../../../services/auditProjectionService.ts'

export interface AuditStore {
  /** Get current audit projection state */
  getState(): AuditProjectionState
  
  /** Subscribe to audit state changes */
  subscribe(listener: () => void): () => void
  
  /** Start the audit projection */
  start(): Promise<void>
  
  /** Stop the audit projection */
  stop(): Promise<void>
  
  /** Query events with filters */
  queryEvents(filter: {
    tenant_id?: string
    aggregate_type?: string
    event_type?: string
    start_time?: number
    end_time?: number
    limit?: number
    offset?: number
  }): readonly AuditEvent[]
  
  /** Export events */
  exportEvents(filter: {
    start_time: number
    end_time: number
  }, format: 'json' | 'csv'): Promise<string>
  
  /** Get system metrics */
  getMetrics(): SystemMetrics
}

export function createAuditStore(
  auditProjectionService: AuditProjectionService
): AuditStore {
  const listeners = new Set<() => void>()
  
  const notifyListeners = () => {
    for (const listener of listeners) {
      listener()
    }
  }
  
  // Subscribe to projection service updates
  auditProjectionService.subscribe(() => {
    notifyListeners()
  })
  
  return {
    getState(): AuditProjectionState {
      return auditProjectionService.getState()
    },
    
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    
    async start(): Promise<void> {
      await auditProjectionService.start()
      notifyListeners()
    },
    
    async stop(): Promise<void> {
      await auditProjectionService.stop()
      notifyListeners()
    },
    
    queryEvents(filter): readonly AuditEvent[] {
      return auditProjectionService.queryEvents({
        filter,
        sort_by: 'timestamp',
        sort_direction: 'desc'
      })
    },
    
    async exportEvents(filter, format): Promise<string> {
      return auditProjectionService.exportEvents(filter, format)
    },
    
    getMetrics(): SystemMetrics {
      return auditProjectionService.getMetrics()
    }
  }
}
