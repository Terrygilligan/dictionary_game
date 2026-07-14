/**
 * SuperAdmin Dashboard Page - Live Integration
 *
 * This page wires the EventStreamDashboard to the real multi-tenant EventStore
 * via AuditProjectionService. It no longer uses mock events or an isolated bus.
 */

import { useEffect, useState } from 'react'
import { useGameStore } from '../../features/play-round/index.ts'
import { useUserStore } from '../../entities/user/index.ts'
import { AuditProjection } from '../../entities/audit/auditProjectionCore.ts'
import { createAuditProjectionService, type AuditProjectionService } from '../../services/auditProjectionService.ts'
import { EventStreamDashboard } from '../../components/admin/EventStreamDashboard.tsx'
import { AdminGuard, MockAuthProvider } from '../../components/admin/AdminGuard.tsx'

/**
 * SuperAdmin Dashboard Page Component
 */
export function SuperAdminDashboardPage() {
  const gameStore = useGameStore()
  const userStore = useUserStore()
  const [auditProjection, setAuditProjection] = useState<AuditProjection | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let service: AuditProjectionService | undefined
    let isMounted = true

    const initializeDashboard = async () => {
      try {
        service = createAuditProjectionService(gameStore, userStore, undefined, { debug: true })
        await service.start()

        if (isMounted) {
          setAuditProjection(service.getAuditProjection())
          setIsInitialized(true)
        }

        console.log('✅ SuperAdmin Dashboard initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize SuperAdmin Dashboard:', error)
      }
    }

    initializeDashboard()

    return () => {
      isMounted = false
      service?.stop()
    }
  }, [gameStore, userStore])

  if (!isInitialized || !auditProjection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SuperAdmin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <MockAuthProvider>
      <AdminGuard requiredRole="admin">
        <EventStreamDashboard auditProjection={auditProjection} />
      </AdminGuard>
    </MockAuthProvider>
  )
}

/**
 * Development helper component for testing the dashboard
 */
export function DevSuperAdminDashboard() {
  return (
    <div className="p-4">
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Development Mode</h3>
        <p className="text-yellow-700">
          This is the development version of the SuperAdmin Dashboard.
          It is now fed by live events from the EventStore.
        </p>
        <p className="text-sm text-yellow-600 mt-2">
          Test credentials: admin@lexiconmaster.com / admin123
        </p>
      </div>
      <SuperAdminDashboardPage />
    </div>
  )
}
