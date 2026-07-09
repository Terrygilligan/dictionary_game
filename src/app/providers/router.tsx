import { useState, useEffect } from 'react'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/profile'
import { GamesPage } from '@/pages/games'
import { GamePage } from '@/pages/game'
import { VillagePage } from '@/pages/village'
import { BaseLayout } from '@/app/ui/BaseLayout'
import { AppProviders } from './AppProviders'
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

  const handleAuthSuccess = (newUser?: User) => {
    console.log('🔐 [AUTH] Hard reset - clearing local storage and state')
  
  // Clear all local storage to prevent cached state issues
  localStorage.clear()
  
  // Reset store state without destroying the instance
  if ((window as any).__resetUserStore) {
    (window as any).__resetUserStore()
  }
  
  // Set the user state when authentication succeeds
  if (newUser) {
    console.log('✅ [AUTH] Login successful - user:', newUser.id, 'navigating to /profile')
    setUser(newUser)
    // Explicit navigation to profile page, ignoring any cached routes
    navigate('profile')
  } else {
    console.log('⚠️ [AUTH] No user data - navigating to village')
    navigate('village')
  }
}

  const handleSignOut = () => {
    console.log('🔄 [AUTH] User signing out, resetting store')
    // Reset store state without destroying the instance
    if ((window as any).__resetUserStore) {
      (window as any).__resetUserStore()
    }
    setUser(null)
    navigate('landing')
  }

  
  return (
    <AppProviders>
      {isLoading ? (
        <div className="page">
          <div className="panel panel--center">
            <p>Loading...</p>
          </div>
        </div>
      ) : (
        <BaseLayout isAuthenticated={!!user}>
          {currentPage === 'landing' && <LandingPage />}
          {currentPage === 'auth' && <AuthPage onAuthSuccess={handleAuthSuccess} />}
          {currentPage === 'games' && (
            user ? (
              <GamesPage />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          )}
          {currentPage === 'profile' && (
            user ? (
              <ProfilePage key={`profile-${user.id}`} user={user} onSignOut={handleSignOut} />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          )}
          {currentPage === 'game' && <GamePage isGuest={!user} />}
          {currentPage === 'village' && (
            user ? (
              <VillagePage />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          )}
          {!['landing', 'auth', 'games', 'profile', 'game', 'village'].includes(currentPage) && <LandingPage />}
        </BaseLayout>
      )}
    </AppProviders>
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
