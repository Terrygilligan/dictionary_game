import { useEffect, useState } from 'react'
import { authService } from '@/services/auth'
import { EventStreamDashboard, createAuditStore } from '../../features/super-admin-dashboard/index.ts'
import { createAuditProjectionService } from '../../services/auditProjectionService.ts'

export function AdminPage() {
  const [auditStore, setAuditStore] = useState<ReturnType<typeof createAuditStore> | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const user = authService.getCurrentUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        // Check if user has admin claims
        const idTokenResult = await authService.getIdTokenResult()
        const adminClaim = idTokenResult.claims.admin || idTokenResult.claims.superAdmin
        
        if (!adminClaim) {
          console.warn('User does not have admin privileges')
          setIsAdmin(false)
          setLoading(false)
          return
        }

        setIsAdmin(true)

        // Initialize audit projection service
        // Note: In a real implementation, you'd need to get the actual store instances
        // For now, we'll create a placeholder implementation
        const service = createAuditProjectionService(
          {} as any, // gameStore placeholder
          {} as any, // userStore placeholder  
          {} as any, // villageStore placeholder
          { debug: true }
        )
        
        // Create audit store
        const store = createAuditStore(service)
        setAuditStore(store)

      } catch (error) {
        console.error('Failed to initialize admin dashboard:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    initializeAdmin()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this dashboard.</p>
        </div>
      </div>
    )
  }

  if (!auditStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Initializing audit system...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EventStreamDashboard auditStore={auditStore} />
    </div>
  )
}
