/**
 * useAudit Hook - Audit Dashboard Data Access
 * 
 * Provides React hook access to the Audit Service with proper tenant isolation.
 * Uses useGameIdentity to ensure all operations are scoped by tenant_id.
 * 
 * Architectural Compliance:
 * - Tenant Isolation: All operations scoped by tenant_id from useGameIdentity
 * - Read-Only Source: Never modifies game_event_logs collection
 * - Event-Sourced: Works with immutable event log structure
 * - FSD-Compliant: Feature layer hook consuming entity layer services
 */

import { useState, useCallback } from 'react'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'
import {
  performDriftDetection,
  getTenantActivitySummary,
  type DriftCheckResult,
} from '@/entities/audit'

/**
 * Audit Hook State
 */
export interface AuditState {
  readonly isLoading: boolean
  readonly error: string | null
  readonly driftResult: DriftCheckResult | null
  readonly tenantSummary: {
    total_events: number
    unique_aggregates: number
    last_activity: number | null
    event_types: Record<string, number>
  } | null
}

/**
 * useAudit Hook
 * 
 * Provides audit functionality with tenant-scoped operations.
 * All operations automatically use the tenant_id from useGameIdentity.
 * 
 * @returns Audit state and functions
 */
export function useAudit() {
  const { tenant_id, aggregate_id, isLoading: identityLoading } = useGameIdentity()
  const [state, setState] = useState<AuditState>({
    isLoading: false,
    error: null,
    driftResult: null,
    tenantSummary: null,
  })

  /**
   * Perform drift detection for the current aggregate
   * Requires both tenant_id and aggregate_id to be available
   */
  const checkDrift = useCallback(async () => {
    // Validate identity before proceeding
    if (!tenant_id || !aggregate_id) {
      const error = 'IDENTITY_REQUIRED: tenant_id and aggregate_id must be available for drift detection'
      console.error(`❌ [AUDIT_HOOK] ${error}`)
      setState(prev => ({ ...prev, error, isLoading: false }))
      return null
    }

    console.log(`🔍 [AUDIT_HOOK] Starting drift check for tenant: ${tenant_id}, aggregate: ${aggregate_id}`)
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Perform drift detection - this is a read-only operation on game_event_logs
      const result = await performDriftDetection(tenant_id, aggregate_id)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        driftResult: result,
        error: result.has_drift ? 'DRIFT_DETECTED: Event log integrity check failed' : null,
      }))

      console.log(`✅ [AUDIT_HOOK] Drift check completed:`, result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during drift detection'
      console.error(`❌ [AUDIT_HOOK] Drift check failed:`, error)
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [tenant_id, aggregate_id])

  /**
   * Get tenant activity summary
   * Requires tenant_id to be available
   */
  const getTenantSummary = useCallback(async () => {
    // Validate identity before proceeding
    if (!tenant_id) {
      const error = 'IDENTITY_REQUIRED: tenant_id must be available for tenant summary'
      console.error(`❌ [AUDIT_HOOK] ${error}`)
      setState(prev => ({ ...prev, error, isLoading: false }))
      return null
    }

    console.log(`📊 [AUDIT_HOOK] Fetching tenant summary for tenant: ${tenant_id}`)
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get tenant activity summary - this is a read-only operation
      const summary = await getTenantActivitySummary(tenant_id)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        tenantSummary: summary,
      }))

      console.log(`✅ [AUDIT_HOOK] Tenant summary fetched:`, summary)
      return summary
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during tenant summary fetch'
      console.error(`❌ [AUDIT_HOOK] Tenant summary fetch failed:`, error)
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return null
    }
  }, [tenant_id])

  /**
   * Perform a complete audit check
   * Runs both drift detection and tenant summary
   */
  const performFullAudit = useCallback(async () => {
    console.log(`🔍 [AUDIT_HOOK] Starting full audit for tenant: ${tenant_id}`)
    
    const driftResult = await checkDrift()
    const tenantSummary = await getTenantSummary()
    
    console.log(`✅ [AUDIT_HOOK] Full audit completed`)
    
    return {
      driftResult,
      tenantSummary,
    }
  }, [checkDrift, getTenantSummary, tenant_id])

  /**
   * Clear audit state
   */
  const clearAudit = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      driftResult: null,
      tenantSummary: null,
    })
  }, [])

  return {
    // State
    ...state,
    
    // Identity
    tenant_id,
    aggregate_id,
    isIdentityReady: !identityLoading && !!tenant_id,
    
    // Functions
    checkDrift,
    getTenantSummary,
    performFullAudit,
    clearAudit,
  }
}
