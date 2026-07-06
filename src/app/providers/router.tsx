import { useState, useEffect } from 'react'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/profile'
import { GamesPage } from '@/pages/games'
import { GamePage } from '@/pages/game'
import { VillagePage } from '@/pages/village'
import { BaseLayout } from '@/app/ui/BaseLayout'
import { initializeI18n } from '@/shared/lib/i18n/i18nService'
import { useNavigation } from '@/shared/lib/navigation'
import type { User } from '@/entities/user'

export function AppRouter() {
  const { currentPage, navigate } = useNavigation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleAuthSuccess = (user?: User) => {
    // Set the user state when authentication succeeds
    if (user) {
      setUser(user)
    }
    console.log('Auth success - navigating to profile')
    navigate('profile')
  }

  const handleSignOut = () => {
    setUser(null)
    navigate('landing')
  }

  
  if (isLoading) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // AuthGuard logic
  if (currentPage === 'profile' && !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  switch (currentPage) {
    case 'landing':
      return (
        <BaseLayout isAuthenticated={!!user}>
          <LandingPage />
        </BaseLayout>
      )
    case 'auth':
      return (
        <BaseLayout isAuthenticated={!!user}>
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        </BaseLayout>
      )
    case 'games':
      return (
        <BaseLayout isAuthenticated={!!user}>
          {user ? (
            <GamesPage />
          ) : (
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          )}
        </BaseLayout>
      )
    case 'profile':
      return (
        <BaseLayout isAuthenticated={!!user}>
          {user ? (
            <ProfilePage user={user} onSignOut={handleSignOut} />
          ) : (
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          )}
        </BaseLayout>
      )
    case 'game':
      return (
        <BaseLayout isAuthenticated={!!user}>
          <GamePage isGuest={!user} />
        </BaseLayout>
      )
    case 'village':
      return (
        <BaseLayout isAuthenticated={!!user}>
          {user ? (
            <VillagePage />
          ) : (
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          )}
        </BaseLayout>
      )
    default:
      return (
        <BaseLayout isAuthenticated={!!user}>
          <LandingPage />
        </BaseLayout>
      )
  }
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
