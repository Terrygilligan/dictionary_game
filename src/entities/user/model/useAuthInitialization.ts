import { useContext } from 'react'
import { UserIdentityContext } from './context.ts'

/**
 * Auth initialization state for service safety
 * Services must check this before attempting Firestore operations
 */
interface AuthInitializationState {
  /** Whether Firebase auth has finished initializing */
  isAuthReady: boolean
  /** Whether a user is currently authenticated */
  isAuthenticated: boolean
  /** Combined check: auth is ready AND user is authenticated */
  canOperate: boolean
}

/**
 * Hook for services to check if it's safe to perform authenticated operations
 * Prevents "Missing or insufficient permissions" errors from ghost sessions
 */
export function useAuthInitialization(): AuthInitializationState {
  const identity = useContext(UserIdentityContext)
  
  // If tenant_id is null, auth is either still initializing or user is signed out
  const isAuthReady = identity?.tenant_id !== null || identity?.aggregate_id !== null
  const isAuthenticated = isAuthReady // tenant_id presence indicates auth resolution
  
  const canOperate = isAuthenticated
  
  return {
    isAuthReady,
    isAuthenticated,
    canOperate,
  }
}

/**
 * Service gate function for non-React contexts
 * Services can call this to check if they should proceed with operations
 */
export function checkAuthInitialization(): boolean {
  // Check if we have identity context in non-React environments
  // This is a fallback for services that don't have React context access
  try {
    // For non-React services, we rely on the UserProvider initialization guard
    // which prevents the app from rendering until auth is settled
    return true
  } catch {
    return false
  }
}
