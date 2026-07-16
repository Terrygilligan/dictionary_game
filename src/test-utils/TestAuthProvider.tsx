import { createContext, useContext, type ReactNode } from 'react'

/**
 * Test User interface for deterministic testing
 * Matches the shape expected by useGameIdentity hook
 */
export interface TestUser {
  readonly id: string
  readonly email: string
  readonly displayName: string
}

/**
 * Test Auth Context interface
 * Provides deterministic auth state for testing
 */
export interface TestAuthContext {
  readonly user: TestUser | null
  readonly isLoading: boolean
  readonly isAuthenticated: boolean
  readonly tenant_id: string | null
}

/**
 * Test Auth Context for deterministic testing
 * 
 * Provides predictable authentication state without Firebase dependencies.
 * Ensures test determinism and CI/CD reliability.
 * 
 * Architectural Compliance:
 * - No side effects or external dependencies
 * - Deterministic user identity for multi-tenant testing
 * - FSD-compliant: test utility in shared layer
 */
const TestAuthContext = createContext<TestAuthContext | null>(null)

/**
 * Test Auth Provider Component
 * 
 * Wraps components with deterministic auth state for testing.
 * Uses a fixed tenant_id to ensure test reproducibility.
 */
export function TestAuthProvider({ 
  children, 
  user = { id: 'test-tenant-123', email: 'test@example.com', displayName: 'Test User' }
}: {
  children: ReactNode
  user?: TestUser | null
}) {
  const context: TestAuthContext = {
    user,
    isLoading: false,
    isAuthenticated: !!user,
    tenant_id: user?.id || null,
  }

  return (
    <TestAuthContext.Provider value={context}>
      {children}
    </TestAuthContext.Provider>
  )
}

/**
 * Hook to access test auth context
 * 
 * Provides the same interface as useFirebaseAuth for testing.
 * Throws descriptive error if used outside provider.
 */
export function useTestAuth(): TestAuthContext {
  const context = useContext(TestAuthContext)
  if (!context) {
    throw new Error('useTestAuth must be used within TestAuthProvider')
  }
  return context
}

/**
 * Mock Firebase Auth Hook
 * 
 * Provides the same interface as useFirebaseAuth but uses test context.
 * Allows components to work unchanged in test environment.
 */
export function useFirebaseAuth() {
  const { user, isLoading, isAuthenticated, tenant_id } = useTestAuth()
  
  return {
    user,
    isLoading,
    isAuthenticated,
    getCurrentUser: () => user,
    tenant_id,
  }
}
