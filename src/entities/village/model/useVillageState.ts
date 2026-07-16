import { useState, useEffect } from 'react'
import { useVillageStore } from './VillageContext'
import { useVillageIdentity } from './VillageContext'
import type { VillageState } from './state'

/**
 * Custom hook to subscribe to village state changes.
 * 
 * This hook provides reactive access to the village state for a specific
 * tenant and aggregate, following the established pattern from the game domain.
 * 
 * Architectural Compliance:
 * - Multi-Tenant: Uses identity context for tenant_id and aggregate_id
 * - Event-Sourced: Subscribes to store changes, not direct state access
 * - Loading Guard: Returns loading state when identity is not ready
 */
export function useVillageState(): {
  villageState: VillageState | null
  isLoading: boolean
  error: string | null
} {
  const store = useVillageStore()
  const { tenant_id, aggregate_id } = useVillageIdentity()
  const [state, setState] = useState<VillageState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Loading guard: wait for identity resolution
    if (!tenant_id || !aggregate_id) {
      setIsLoading(true)
      setError(null)
      setState(null)
      return
    }

    try {
      setIsLoading(false)
      setError(null)
      const currentState = store.getState(tenant_id, aggregate_id)
      setState(currentState)
    } catch (err) {
      setIsLoading(false)
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('🏘️ [VILLAGE_STATE] Error getting village state:', err)
    }
  }, [store, tenant_id, aggregate_id])

  return {
    villageState: state,
    isLoading,
    error,
  }
}
