import { useEffect } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { useNavigation } from '@/shared/lib/navigation'
import { useGameDispatch } from '@/features/play-round'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'
import { LandingContent } from './LandingContent'

export function LandingPage() {
  const { t } = useTranslate()
  const { navigate, currentPage } = useNavigation()
  const dispatch = useGameDispatch()
  const { tenant_id, aggregate_id, isLoading, error } = useGameIdentity()

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

  // Helper function to safely get translations with fallbacks
  const safeT = (key: string, fallback?: string) => {
    const translation = t(key)
    // If translation equals the key (not found) and we have a fallback, use fallback
    if (translation === key && fallback) {
      return fallback
    }
    return translation
  }

  const handlePlayAsGuest = () => {
    console.log('🎮 [LANDING] Play as Guest button clicked - navigating to game page')
    navigate('game')
  }

  const handleRegister = () => {
    console.log('📝 [LANDING] Register button clicked - navigating to auth page')
    navigate('auth')
  }

  return (
    <LandingContent 
      safeT={safeT}
      handlePlayAsGuest={handlePlayAsGuest}
      handleRegister={handleRegister}
    />
  )
}
