import { useState, useEffect } from 'react'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/profile'
import { GamesPage } from '@/pages/games'
import { GamePage } from '@/pages/game'
import { VillagePage } from '@/pages/village'
import { AdminPage } from '@/pages/admin/AdminPage'
import { BaseLayout } from '@/app/ui/BaseLayout'
import { initializeI18n } from '@/shared/lib/i18n/i18nService'
import { useNavigation } from '@/shared/lib/navigation'
import type { User } from '@/entities/user'

export function AppRouter() {
  const { currentPage, navigate, isNavigating } = useNavigation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoidTransition, setIsVoidTransition] = useState(false)
  
  
  // Initialize i18n and check auth state on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize i18n service
        await initializeI18n()
        
        // For now, always start with landing page
        // TODO: Re-enable auth check when Firebase is configured
        setUser(null)
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // NAV_START event listener for Void transition
  useEffect(() => {
    const handleNavStart = () => {
      console.log('🕳️ [ROUTER] NAV_START received - initiating Void transition')
      setIsVoidTransition(true)
      
      // Force component tree destruction for 50ms
      const timeout = setTimeout(() => {
        console.log('🕳️ [ROUTER] Void transition complete - resuming render')
        setIsVoidTransition(false)
      }, 50)
      
      return () => clearTimeout(timeout)
    }

    window.addEventListener('NAV_START', handleNavStart)
    return () => window.removeEventListener('NAV_START', handleNavStart)
  }, [])

  // Listen to auth state changes
  // TODO: Re-enable when Firebase is configured
  /*
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser)
      if (authUser) {
        setCurrentPage('profile')
      }
    })

    return unsubscribe
  }, [])
  */

  const handleAuthSuccess = (newUser?: User) => {
  // Clear all local storage to prevent cached state issues
  localStorage.clear()
  
  // Reset store state without destroying the instance
  if ((window as any).__resetUserStore) {
    (window as any).__resetUserStore()
  }
  
  // Set the user state when authentication succeeds
  if (newUser) {
    setUser(newUser)
    // Explicit navigation to profile page, ignoring any cached routes
    navigate('profile')
  } else {
    navigate('village')
  }
}

  const handleSignOut = () => {
    // Reset store state without destroying the instance
    if ((window as any).__resetUserStore) {
      (window as any).__resetUserStore()
    }
    setUser(null)
    navigate('landing')
  }

  
  return (
    <>
      {isLoading ? (
        <div className="page">
          <div className="panel panel--center">
            <p>Loading...</p>
          </div>
        </div>
      ) : isVoidTransition ? (
        <BaseLayout isAuthenticated={!!user}>
          <div className="page">
            <div className="panel panel--center">
              <p>Transitioning...</p>
            </div>
          </div>
        </BaseLayout>
      ) : (
        <BaseLayout isAuthenticated={!!user}>
          {(() => {
            switch (currentPage) {
              case 'games':
                return <GamesPage />
              case 'profile':
                return user ? <ProfilePage user={user} onSignOut={handleSignOut} /> : null
              case 'landing':
                return <LandingPage />
              case 'village':
                return <VillagePage />
              case 'auth':
                return <AuthPage onAuthSuccess={handleAuthSuccess} />
              default:
                return <LandingPage />
            }
          })()}
        </BaseLayout>
      )}
    </>
  )
}

/**
 * AuthGuard component for protecting routes
 * This is a simple implementation - in a real app this would be more sophisticated
 */
export function AuthGuard({ children, user }: { children: React.ReactNode; user: User | null }) {
  if (!user) {
    // Redirect to auth page
    return <AuthPage onAuthSuccess={() => {}} />
  }

  return <>{children}</>
}
