import { useEffect, useRef } from 'react'
import type { User } from '@/entities/user'

/**
 * Hook to detect email verification changes and dispatch verification events
 */
export function useEmailVerification(currentUser: User | null) {
  const previousEmailVerifiedRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!currentUser) {
      previousEmailVerifiedRef.current = null
      return
    }

    const currentEmailVerified = currentUser.emailVerified
    const previousEmailVerified = previousEmailVerifiedRef.current

    // Check if email verification status changed from false to true
    if (previousEmailVerified === false && currentEmailVerified === true) {
      console.log('🔍 [EMAIL_VERIFICATION] Email verification detected:', {
        userId: currentUser.id,
        email: currentUser.email,
        verifiedAt: Date.now()
      })

      // TODO: Re-implement email verification event dispatch
      // userProjectionService was deleted - need to re-implement or use alternative approach
      console.log('📧 [EMAIL_VERIFICATION] Email verification detected:', {
        userId: currentUser.id,
        email: currentUser.email,
        verifiedAt: Date.now()
      })
      // userProjectionService.processUserEvent({
      //   type: 'user/email-verified',
      //   userId: currentUser.id,
      //   email: currentUser.email,
      //   verifiedAt: Date.now(),
      // }).then(() => {
      //   console.log('✅ [EMAIL_VERIFICATION] USER_EMAIL_VERIFIED event processed')
      // }).catch((error) => {
      //   console.error('❌ [EMAIL_VERIFICATION] Failed to process USER_EMAIL_VERIFIED event:', error)
      // })
    }

    // Update the ref for next comparison
    previousEmailVerifiedRef.current = currentEmailVerified
  }, [currentUser])
}
