import { useSyncExternalStore } from 'react'
import type { AuditStore } from '../model/auditStore.ts'

export function useAuditStore(auditStore: AuditStore) {
  const state = useSyncExternalStore(
    auditStore.subscribe,
    auditStore.getState,
    auditStore.getState
  )
  
  return {
    state,
    start: auditStore.start,
    stop: auditStore.stop,
    queryEvents: auditStore.queryEvents,
    exportEvents: auditStore.exportEvents,
    getMetrics: auditStore.getMetrics,
  }
}
