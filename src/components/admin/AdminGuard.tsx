/**
 * AdminGuard - Role-Based Access Control for SuperAdmin Dashboard
 * 
 * This component provides authentication and authorization for the SuperAdmin Dashboard
 * using Firebase Custom Claims for secure role-based access control.
 * 
 * Security Note: This implementation uses real Firebase custom claims for production security.
 * Claims are verified via IdTokenResult and cannot be spoofed by client-side manipulation.
 */

import { type ReactNode } from 'react'
import { useUserClaims } from '@/entities/user'

/**
 * User roles for the application
 */
export type UserRole = 'guest' | 'user' | 'admin' | 'superadmin'

/**
 * AdminGuard Component - Protects admin routes with role-based access
 */
export function AdminGuard({
  children,
  requiredRole = 'admin',
  fallback = <AccessDenied />
}: {
  children: ReactNode
  requiredRole?: UserRole
  fallback?: ReactNode
}) {
  const { isSuperAdmin, isAdmin, isLoading } = useUserClaims()

  console.log('[ADMIN_GUARD] Checking permissions: isSuperAdmin=', isSuperAdmin, ', isAdmin=', isAdmin, ', isLoading=', isLoading)

  // Show loading state while claims are being fetched
  if (isLoading) {
    console.log('[ADMIN_GUARD] Claims still loading, showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  console.log('[AdminGuard] Authorization check:')
  console.log('[AdminGuard] isSuperAdmin:', isSuperAdmin)
  console.log('[AdminGuard] isAdmin:', isAdmin)
  console.log('[AdminGuard] requiredRole:', requiredRole)
  console.log('[AdminGuard] hasRequiredRole:', hasRequiredRole(isSuperAdmin, isAdmin, requiredRole))

  // Check if user has required role
  if (!hasRequiredRole(isSuperAdmin, isAdmin, requiredRole)) {
    console.log('[AdminGuard] ACCESS DENIED - redirecting to fallback')
    return fallback
  }

  console.log('[AdminGuard] ACCESS GRANTED - rendering children')
  // User is authenticated and authorized
  return <>{children}</>
}

/**
 * Check if user has the required role based on Firebase custom claims
 */
function hasRequiredRole(isSuperAdmin: boolean, isAdmin: boolean, requiredRole: UserRole): boolean {
  switch (requiredRole) {
    case 'guest':
      return true // Everyone can access guest routes
    case 'user':
      return true // Authenticated users can access user routes
    case 'admin':
      return isAdmin || isSuperAdmin
    case 'superadmin':
      return isSuperAdmin
    default:
      return false
  }
}

/**
 * Access denied component
 */
function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access the SuperAdmin Dashboard.
        </p>
        <p className="text-sm text-gray-500">
          Required role: Admin or SuperAdmin with Firebase Custom Claims
        </p>
      </div>
    </div>
  )
}
