import { useMemo } from 'react'
import { villageStore, type VillageStore } from './villageStore'
import { VillageStoreContext, VillageIdentityContext } from './VillageContext'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'
import type { VillageIdentityContextValue } from './VillageContext'

interface VillageProviderProps {
  children: React.ReactNode
  /** Optional custom store instance for testing */
  store?: VillageStore
}

/**
 * Village Provider
 * 
 * Manages the village store lifecycle and provides village identity context.
 * Integrates with the existing game identity system for multi-tenant isolation.
 * 
 * Architectural Compliance:
 * - Multi-Tenant: Uses game identity for tenant_id and aggregate_id
 * - Event-Sourced: All village operations go through the village store
 * - Provider Pattern: Follows established provider conventions
 */
export function VillageProvider({ children, store: customStore }: VillageProviderProps) {
  const { tenant_id, aggregate_id, isLoading } = useGameIdentity()

  // Use custom store if provided, otherwise use singleton
  const store = useMemo(() => customStore || villageStore, [customStore])

  // Village identity value
  const villageIdentity: VillageIdentityContextValue = useMemo(
    () => ({
      tenant_id: isLoading ? null : tenant_id,
      aggregate_id: isLoading ? null : aggregate_id,
    }),
    [tenant_id, aggregate_id, isLoading]
  )

  return (
    <VillageStoreContext.Provider value={store}>
      <VillageIdentityContext.Provider value={villageIdentity}>
        {children}
      </VillageIdentityContext.Provider>
    </VillageStoreContext.Provider>
  )
}
