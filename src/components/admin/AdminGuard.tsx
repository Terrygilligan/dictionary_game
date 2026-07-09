/**
 * AdminGuard - Role-Based Access Control for SuperAdmin Dashboard
 * 
 * This component provides authentication and authorization for the SuperAdmin Dashboard.
 * Currently implements a mock authentication system that can be easily replaced with
 * real Firebase authentication later.
 * 
 * Security Note: This is a MOCK implementation for development purposes.
 * In production, this should be replaced with proper Firebase custom claims.
 */

import React, { useState, useEffect, type ReactNode } from 'react'

/**
 * User roles for the application
 */
export type UserRole = 'guest' | 'user' | 'admin' | 'superadmin'

/**
 * User interface for authentication context
 */
export interface User {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly role: UserRole
  readonly lastLogin: number
}

/**
 * Authentication context interface
 */
export interface AuthContext {
  readonly user: User | null
  readonly isLoading: boolean
  readonly isAuthenticated: boolean
  readonly isAdmin: boolean
  readonly isSuperAdmin: boolean
  readonly login: (email: string, password: string) => Promise<void>
  readonly logout: () => void
  readonly switchRole: (role: UserRole) => void // Mock function for testing
}

/**
 * Mock authentication context
 * In production, this would be replaced with Firebase Auth
 */
const MockAuthContext = React.createContext<AuthContext | null>(null)

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
  const auth = useMockAuth()

  // Show loading state while checking authentication
  if (auth.isLoading) {
    return <LoadingSpinner />
  }

  // Check if user is authenticated
  if (!auth.isAuthenticated) {
    return <LoginForm onLogin={auth.login} />
  }

  // Check if user has required role
  if (!hasRequiredRole(auth.user?.role, requiredRole)) {
    return fallback
  }

  // User is authenticated and authorized
  return <>{children}</>
}

/**
 * Hook to access mock authentication
 * Provides the same interface as real Firebase Auth for easy migration
 */
export function useMockAuth(): AuthContext {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock authentication - in production this would be Firebase Auth
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      
      // Simulate auth check delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check for stored mock user (localStorage for persistence)
      const storedUser = localStorage.getItem('mock_admin_user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          // Check if session is still valid (24-hour expiry)
          if (Date.now() - parsedUser.lastLogin < 24 * 60 * 60 * 1000) {
            setUser(parsedUser)
          } else {
            localStorage.removeItem('mock_admin_user')
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('mock_admin_user')
        }
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      // Mock authentication logic
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      // Mock user database - in production this would be Firebase Auth
      const mockUsers: Record<string, { password: string; role: UserRole; displayName: string }> = {
        'admin@lexiconmaster.com': {
          password: 'admin123',
          role: 'superadmin',
          displayName: 'Super Admin'
        },
        'user@lexiconmaster.com': {
          password: 'user123',
          role: 'user',
          displayName: 'Regular User'
        },
        'test@lexiconmaster.com': {
          password: 'test123',
          role: 'admin',
          displayName: 'Test Admin'
        }
      }

      const mockUser = mockUsers[email.toLowerCase()]
      
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid credentials')
      }

      // Create authenticated user
      const authenticatedUser: User = {
        id: `user_${Date.now()}`,
        email,
        displayName: mockUser.displayName,
        role: mockUser.role,
        lastLogin: Date.now()
      }

      // Store user session
      localStorage.setItem('mock_admin_user', JSON.stringify(authenticatedUser))
      setUser(authenticatedUser)
      
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mock_admin_user')
  }

  const switchRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role, lastLogin: Date.now() }
      setUser(updatedUser)
      localStorage.setItem('mock_admin_user', JSON.stringify(updatedUser))
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    login,
    logout,
    switchRole
  }
}

/**
 * Check if user has the required role or higher
 */
function hasRequiredRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    admin: 2,
    superadmin: 3
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Login form component for mock authentication
 */
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await onLogin(email, password)
    } catch (error) {
      setError('Invalid credentials. Try admin@lexiconmaster.com / admin123 for superadmin access.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SuperAdmin Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the audit control room
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Test accounts:</p>
            <p>admin@lexiconmaster.com / admin123 (SuperAdmin)</p>
            <p>test@lexiconmaster.com / test123 (Admin)</p>
            <p>user@lexiconmaster.com / user123 (User)</p>
          </div>
        </form>
      </div>
    </div>
  )
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
          Required role: Admin or SuperAdmin
        </p>
      </div>
    </div>
  )
}

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    </div>
  )
}

/**
 * Provider component for mock authentication context
 */
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const auth = useMockAuth()
  
  return (
    <MockAuthContext.Provider value={auth}>
      {children}
    </MockAuthContext.Provider>
  )
}

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContext {
  const context = React.useContext(MockAuthContext)
  if (!context) {
    throw new Error('useAuth must be used within MockAuthProvider')
  }
  return context
}
