import { useUserStore } from '@/entities/user'
import { useEmailVerification } from '@/hooks/useEmailVerification'

/**
 * Component that tracks email verification changes and updates the user store
 * This component should be rendered within the UserProvider
 */
export function EmailVerificationTracker() {
  const userState = useUserStore()
  const currentUser = userState.getState('default', 'default').user

  // Use the email verification hook to detect changes and dispatch events
  useEmailVerification(currentUser)

  return null // This component doesn't render anything
}
