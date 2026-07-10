import { useState, useEffect } from 'react'
import { useGameIdentity } from './useFirebaseAuth'

/**
 * Hook that encapsulates identity resolution state for loading guards.
 * 
 * Ensures components wait for tenant_id and aggregate_id propagation before
 * accessing game state, maintaining event-sourced integrity.
 */
export function useIdentityReady() {
  const { tenant_id, aggregate_id, isLoading, error } = useGameIdentity()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Identity is ready when:
    // 1. Not loading
    // 2. No error
    // 3. Both tenant_id and aggregate_id are available
    const ready = !isLoading && !error && !!tenant_id && !!aggregate_id
    
    if (ready !== isReady) {
      setIsReady(ready)
      console.log('🔐 [IDENTITY_READY] Identity state changed:', { 
        isReady: ready, 
        tenant_id: tenant_id ? 'available' : 'missing',
        aggregate_id: aggregate_id ? 'available' : 'missing',
        isLoading,
        error
      })
    }
  }, [tenant_id, aggregate_id, isLoading, error, isReady])

  return {
    isReady,
    tenant_id,
    aggregate_id,
    isLoading,
    error
  }
}
