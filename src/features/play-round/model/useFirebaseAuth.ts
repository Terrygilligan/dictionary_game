import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/auth'
import type { User } from '@/entities/user'
import { DEFAULT_TENANT_ID } from '@/shared/config/tenant.ts'

/**
 * Firebase Auth Hook - Production-ready authentication state management
 * 
 * Provides reactive access to Firebase authentication state without side effects.
 * Strictly read-only - only exposes user identity for authentication purposes.
 * 
 * Architectural Compliance:
 * - No mutations of auth state (handled by authService)
 * - Pure identity extraction for multi-tenant isolation
 * - FSD-compliant: feature-layer hook consuming service layer
 * - CRITICAL: tenant_id is NOT the uid - it represents community scope
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    setIsLoading(true)
    
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Get current user synchronously (for immediate access)
  const getCurrentUser = useCallback(() => {
    return authService.getCurrentUser()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    getCurrentUser,
    // CRITICAL FIX: Use DEFAULT_TENANT_ID, NOT uid
    // tenant_id represents community scope, NOT individual user identity
    tenant_id: user ? DEFAULT_TENANT_ID : null,
  }
}

/**
 * Game Identity Hook - Combines Firebase tenant_id with user aggregate_id
 * 
 * Provides proper identity metadata for multi-tenant isolation.
 * tenant_id: Community scope (DEFAULT_TENANT_ID)
 * aggregate_id: User instance within tenant (uid)
 * 
 * Architectural Compliance:
 * - Multi-tenant isolation with proper separation
 * - Explicit identity metadata for command compliance
 * - No side effects - pure identity extraction
 */
export function useGameIdentity() {
  const { user, tenant_id, isLoading: authLoading } = useFirebaseAuth()
  
  // CRITICAL: aggregate_id should be the user's uid, NOT a random UUID
  // This represents the user instance within the tenant
  const aggregate_id = user?.id || null

  // Render-safe loading state - prevents race condition crashes
  if (authLoading) {
    return {
      tenant_id: null,
      aggregate_id: null,
      isLoading: true,
    }
  }

  // Validate tenant availability
  if (!tenant_id) {
    return {
      tenant_id: null,
      aggregate_id: null,
      isLoading: false,
      error: 'AUTHENTICATION_REQUIRED: No tenant_id available for game session'
    }
  }

  return {
    tenant_id, // Non-null assertion validated above
    aggregate_id, // User's uid as aggregate_id
    isLoading: false,
  }
}
