import { useState, useEffect } from 'react'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/profile'
import { GamesPage } from '@/pages/games'
import { GamePage } from '@/pages/game'
import { VillagePage } from '@/pages/village'
import { SuperAdminDashboardPage } from '@/pages/admin/SuperAdminDashboardPage'
import { BaseLayout } from '@/app/ui/BaseLayout'
import { AuthGuard } from '@/shared/auth/AuthGuard'
import { initializeI18n } from '@/shared/lib/i18n/i18nService'
import { useNavigation } from '@/shared/lib/navigation'
import type { User } from '@/entities/user'

export function AppRouter() {
  const { currentPage, navigate } = useNavigation()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
    
  // Debug: Track AppRouter renders to identify duplication
  useEffect(() => {
    console.log(`🔄 [ROUTER] AppRouter render: currentPage=${currentPage}, isLoading=${isLoading}`)
  }, [currentPage, isLoading])
  
  
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

  // TEMPORARY BYPASS: Disable Void transition system causing navigation button disappearance
  // useEffect(() => {
  //   const handleNavStart = () => {
  //     console.log('🕳️ [ROUTER] NAV_START received - initiating Void transition')
  //     setIsVoidTransition(true)
      
  //     // Force component tree destruction for 50ms
  //     const timeout = setTimeout(() => {
  //       console.log('🕳️ [ROUTER] Void transition complete - resuming render')
  //       setIsVoidTransition(false)
  //     }, 50)
      
  //     return () => clearTimeout(timeout)
  //   }

  //   window.addEventListener('NAV_START', handleNavStart)
  //   return () => window.removeEventListener('NAV_START', handleNavStart)
  // }, [])

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
      ) : (
        <BaseLayout isAuthenticated={!!user}>
          {(() => {
            switch (currentPage) {
              case 'games':
                return <GamesPage />
              case 'game':
                return <GamePage />
              case 'profile':
                return (
                  <AuthGuard isAuthenticated={!!user} isLoading={isLoading}>
                    {user && <ProfilePage user={user} onSignOut={handleSignOut} />}
                  </AuthGuard>
                )
              case 'landing':
                return <LandingPage />
              case 'village':
                return (
                  <AuthGuard isAuthenticated={!!user} isLoading={isLoading}>
                    <VillagePage />
                  </AuthGuard>
                )
              case 'auth':
                return <AuthPage onAuthSuccess={handleAuthSuccess} />
              case 'admin':
                return <SuperAdminDashboardPage />
              default:
                return <LandingPage />
            }
          })()}
        </BaseLayout>
      )}
    </>
  )
}

