import { useEffect } from 'react'
import { LandingPage } from '@/pages/landing'
import { AuthPage } from '@/pages/auth'
import { ProfilePage } from '@/pages/profile'
import { GamesPage } from '@/pages/games'
import { VillagePage } from '@/pages/village'
import { SuperAdminDashboardPage } from '@/pages/admin/SuperAdminDashboardPage'
import { BaseLayout } from '@/app/ui/BaseLayout'
import { AuthGuard } from '@/shared/auth/AuthGuard'
import { initializeI18n } from '@/shared/lib/i18n/i18nService'
import { useNavigation } from '@/shared/lib/navigation'
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth'
import { AdminGuard } from '@/components/admin/AdminGuard'

export function AppRouter() {
  const { currentPage, navigate } = useNavigation()
  const { user, isLoading: authLoading } = useFirebaseAuth()

  // Debug: Track AppRouter renders to identify duplication
  useEffect(() => {
    console.log(`🔄 [ROUTER] AppRouter render: currentPage=${currentPage}, user=${user?.id}, authLoading=${authLoading}`)
  }, [currentPage, user, authLoading])

  // Diagnostic: Log current path and user claims
  useEffect(() => {
    const currentPath = window.location.pathname
    console.log(`[ROUTER] Current path: ${currentPath}, User claims: ${JSON.stringify(user?.claims)}`)
  }, [currentPage, user])
  
  // Initialize i18n on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeI18n()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initialize()
  }, [])

  const handleAuthSuccess = () => {
    console.log('[AUTH_SUCCESS] Login successful, preparing redirect to profile')
    
    // Clear all local storage to prevent cached state issues
    localStorage.clear()
    console.log('[AUTH_SUCCESS] Local storage cleared')
    
    // Reset store state without destroying the instance
    if ((window as any).__resetUserStore) {
      (window as any).__resetUserStore()
      console.log('[AUTH_SUCCESS] User store reset')
    }
    
    // Wait for UserProvider to settle before navigating
    console.log('[AUTH_SUCCESS] Waiting 200ms for UserProvider to settle...')
    setTimeout(() => {
      console.log('[AUTH_SUCCESS] UserProvider settled, navigating to profile')
      navigate('profile')
    }, 200)
  }

  
  return (
    <>
      <BaseLayout isAuthenticated={!!user}>
        {(() => {
          switch (currentPage) {
            case 'games':
              return <GamesPage />
            case 'profile':
              return (
                <AuthGuard isAuthenticated={!!user} isLoading={authLoading}>
                  {user && <ProfilePage user={user} />}
                </AuthGuard>
              )
            case 'landing':
              return <LandingPage />
            case 'village':
              return (
                <AuthGuard isAuthenticated={!!user} isLoading={authLoading}>
                  <VillagePage />
                </AuthGuard>
              )
            case 'auth':
              return <AuthPage onAuthSuccess={handleAuthSuccess} />
            case 'admin':
              console.log('[ROUTER] Rendering admin route')
              return (
                <AdminGuard requiredRole="admin">
                  <SuperAdminDashboardPage />
                </AdminGuard>
              )
            default:
              return <LandingPage />
          }
        })()}
      </BaseLayout>
    </>
  )
}

