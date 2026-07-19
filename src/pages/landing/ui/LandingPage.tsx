import { useEffect } from 'react'
import { useNavigation } from '@/shared/lib/navigation'
import { useGameDispatch } from '@/features/play-round'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'
import { useGuestAccess } from '@/features/guest-access'
import { LandingContent } from './LandingContent'

export function LandingPage() {
  const { navigate, currentPage } = useNavigation()
  const dispatch = useGameDispatch()
  const { tenant_id, aggregate_id, isLoading, error } = useGameIdentity()
  
  // Guest access hook - handles eligibility via event sourcing
  const { 
    isAccessGranted, 
    requestGuestAccess 
  } = useGuestAccess()

  // Debug: Verify navigation hook is working
  useEffect(() => {
    console.log('🏠 [LANDING] LandingPage mounted/updated')
    console.log('🏠 [LANDING] Navigation hook state:', { currentPage, navigate: typeof navigate })
  }, [currentPage, navigate])

  
  // Reset game state when landing page loads - only if identity is available
  useEffect(() => {
    // Only dispatch if identity is resolved to prevent COMMAND_IDENTITY_VIOLATION
    if (!isLoading && !error && tenant_id && aggregate_id) {
      dispatch({ 
        type: 'resetGame', 
        reason: 'navigation-change',
        tenant_id,      // ✅ Identity compliance
        aggregate_id    // ✅ Identity compliance
      })
    }
  }, [dispatch, tenant_id, aggregate_id, isLoading, error])

  // Navigation side-effect: navigate to games when guest access is granted
  useEffect(() => {
    if (isAccessGranted) {
      console.log('✅ [LANDING] Guest access granted - navigating to games page')
      navigate('games')
    }
  }, [isAccessGranted, navigate])

  const handlePlayAsGuest = () => {
    console.log('🎮 [LANDING] Play as Guest button clicked - requesting guest access')
    
    // Dispatch command to user entity decider
    // The decider will evaluate eligibility and emit appropriate events
    requestGuestAccess()
  }

  const handleRegister = () => {
    console.log('📝 [LANDING] Register button clicked - navigating to auth page')
    navigate('auth')
  }

  return (
    <LandingContent 
      handlePlayAsGuest={handlePlayAsGuest}
      handleRegister={handleRegister}
    />
  )
}
