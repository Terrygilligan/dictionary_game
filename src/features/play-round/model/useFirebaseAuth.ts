import { useState, useEffect, useCallback } from 'react'
import { authService } from '@/services/auth'
import type { User } from '@/entities/user'

/**
 * Firebase Auth Hook - Production-ready authentication state management
 * 
 * Provides reactive access to Firebase authentication state without side effects.
 * Strictly read-only - only exposes user identity for tenant_id generation.
 * 
 * Architectural Compliance:
 * - No mutations of auth state (handled by authService)
 * - Pure identity extraction for multi-tenant isolation
 * - FSD-compliant: feature-layer hook consuming service layer
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
    // Expose tenant_id directly for multi-tenant compliance
    tenant_id: user?.id || null,
  }
}

/**
 * Game Identity Hook - Combines Firebase tenant_id with session aggregate_id
 * 
 * Generates unique session identifiers for game session isolation.
 * Each game session becomes an independent aggregate in the EventStore.
 * 
 * Architectural Compliance:
 * - Session isolation for Blind Arbiter pattern
 * - Explicit identity metadata for command compliance
 * - No side effects - pure identity generation
 */
export function useGameIdentity() {
  const { tenant_id, isLoading: authLoading } = useFirebaseAuth()
  const [aggregate_id] = useState(() => crypto.randomUUID())

  // Render-safe loading state - prevents race condition crashes
  if (authLoading) {
    return {
      tenant_id: null,
      aggregate_id,
      isLoading: true,
    }
  }

  // Validate tenant availability
  if (!tenant_id) {
    return {
      tenant_id: null,
      aggregate_id,
      isLoading: false,
      error: 'AUTHENTICATION_REQUIRED: No tenant_id available for game session'
    }
  }

  return {
    tenant_id, // Non-null assertion validated above
    aggregate_id,
    isLoading: false,
  }
}
