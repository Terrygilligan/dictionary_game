import { type ReactNode, useEffect, useState } from 'react'
import { useNavigation } from '@/shared/lib/navigation'

interface AuthGuardProps {
  isAuthenticated: boolean
  isLoading?: boolean
  children: ReactNode
}

/**
 * Authentication guard component that redirects unauthenticated users to auth page
 * Prevents flash of unauthorized content by checking loading state first
 */
export function AuthGuard({ isAuthenticated, isLoading = false, children }: AuthGuardProps) {
  const { navigate } = useNavigation()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Handle navigation in useEffect to prevent React warning
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('auth')
      setShouldRedirect(true)
    }
  }, [isLoading, isAuthenticated, navigate])

  // Wait for authentication to resolve before making decisions
  if (isLoading) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <div className="panel__loading">Loading...</div>
        </div>
      </div>
    )
  }

  // Show redirect state while navigation happens
  if (!isAuthenticated || shouldRedirect) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <div className="panel__loading">Redirecting to sign in...</div>
        </div>
      </div>
    )
  }

  // Authenticated users can access protected content
  return <>{children}</>
}
