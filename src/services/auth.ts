import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  getIdTokenResult,
  type User as FirebaseUser
} from 'firebase/auth'
import { getFirebaseAuth } from '@/shared/api/firebase'
import type { User, UserClaims } from '@/entities/user'

/**
 * Authentication service that handles Firebase Auth operations
 * while maintaining the Blind Arbiter pattern - tokens are never exposed to UI.
 */
export interface AuthService {
  /** Sign in with email and password */
  signIn(email: string, password: string): Promise<AuthResult>
  
  /** Create new user account */
  signUp(email: string, password: string, displayName: string): Promise<AuthResult>
  
  /** Sign out current user */
  signOut(): Promise<void>
  
  /** Listen to auth state changes */
  onAuthStateChanged(callback: (user: User | null) => void): () => void
  
  /** Update user profile */
  updateProfile(displayName: string): Promise<void>
  
  /** Reset password */
  resetPassword(email: string): Promise<void>
  
  /** Send email verification */
  sendEmailVerification(): Promise<void>
  
  /** Check if email is verified */
  isEmailVerified(): boolean
  
  /** Refresh user data */
  refreshUser(): Promise<void>
  
  /** Get current authenticated user */
  getCurrentUser(): User | null
  
  /** Get ID token result with claims (for admin verification) */
  getIdTokenResult(): Promise<any>

  /** Force refresh ID token to get latest custom claims */
  forceTokenRefresh(): Promise<void>
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  /** For internal use only - never exposed to UI */
  token?: string
}

/**
 * Extract custom claims from Firebase user
 * This is async because we need to fetch the IdTokenResult
 */
async function extractUserClaims(firebaseUser: FirebaseUser): Promise<UserClaims> {
  try {
    console.log('[authService] Extracting claims for user:', firebaseUser.uid)
    const idTokenResult = await getIdTokenResult(firebaseUser)
    const claims = idTokenResult.claims || {}
    
    console.log('[authService] Raw IdTokenResult claims:', JSON.stringify(claims, null, 2))
    console.log('[authService] superadmin claim value:', claims.superadmin)
    console.log('[authService] admin claim value:', claims.admin)
    
    const extractedClaims = {
      superadmin: claims.superadmin === true,
      admin: claims.admin === true,
    }
    
    console.log('[authService] Extracted claims:', extractedClaims)
    return extractedClaims
  } catch (error) {
    console.error('[authService] Failed to extract user claims:', error)
    return {}
  }
}

/**
 * Convert Firebase User to domain User entity
 */
async function firebaseUserToDomainUser(firebaseUser: FirebaseUser): Promise<User> {
  const claims = await extractUserClaims(firebaseUser)
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Anonymous User',
    emailVerified: firebaseUser.emailVerified || false,
    createdAt: firebaseUser.metadata.creationTime ? 
      new Date(firebaseUser.metadata.creationTime).getTime() : 
      Date.now(),
    lastLoginAt: firebaseUser.metadata.lastSignInTime ? 
      new Date(firebaseUser.metadata.lastSignInTime).getTime() : 
      undefined,
    stats: {
      gamesPlayed: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      streak: 0,
      highestStreak: 0,
      updatedAt: Date.now(),
    },
    claims,
  }
}

/**
 * Firebase Auth implementation
 */
class FirebaseAuthService implements AuthService {
  private auth = getFirebaseAuth()
  private currentUser: User | null = null

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
      const user = await firebaseUserToDomainUser(userCredential.user)
      this.currentUser = user
      
      // Get token for internal use (never exposed to UI)
      const token = await userCredential.user.getIdToken()
      
      return {
        success: true,
        user,
        token, // For internal auth service use only
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password)
      
      // Update display name
      await updateProfile(userCredential.user, { displayName })
      
      // Send email verification
      // await sendEmailVerification(userCredential.user)  // DISABLED: Use custom EmailVerificationService instead
      
      const user = await firebaseUserToDomainUser(userCredential.user)
      this.currentUser = user
      
      // Get token for internal use
      const token = await userCredential.user.getIdToken()
      
      // 🔍 DEBUG LOG: User registration event
      console.log('🔍 [AUTH] USER_REGISTERED event triggered:', {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      })
      
      // 🎯 Emit USER_REGISTERED event to projection system
      // TODO: Re-implement projection service or use alternative approach
      console.log('📝 [AUTH] User registered:', {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      // await userProjectionService.processUserEvent({
      //   type: 'user/registered',
      //   userId: user.id,
      //   email: user.email,
      //   displayName: user.displayName,
      //   emailVerified: user.emailVerified,
      //   createdAt: user.createdAt,
      // })
      // console.log('✅ [AUTH] USER_REGISTERED event processed by projection service')
      // } catch (error) {
      //   console.error('❌ [AUTH] Failed to process USER_REGISTERED event:', error)
      //   // Don't fail the signup if projection fails, but log the error
      // }
      
      return {
        success: true,
        user,
        token, // For internal auth service use only
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  async signOut(): Promise<void> {
    console.log('🚪 [AUTH_SERVICE] Starting absolute sign-out process')
    
    try {
      // Step 1: Call Firebase signOut
      console.log('🚪 [AUTH_SERVICE] Step 1: Calling Firebase signOut')
      await signOut(this.auth)
      console.log('✅ [AUTH_SERVICE] Firebase signOut successful')
      
      // Step 2: Clear local state
      console.log('🚪 [AUTH_SERVICE] Step 2: Clearing local user state')
      this.currentUser = null
      console.log('✅ [AUTH_SERVICE] Local user state cleared')
      
      // Step 3: Clear localStorage
      console.log('🚪 [AUTH_SERVICE] Step 3: Clearing localStorage')
      const localStorageKeysBefore = Object.keys(localStorage)
      console.log('🗑️ [AUTH_SERVICE] localStorage keys before clear:', localStorageKeysBefore)
      localStorage.clear()
      console.log('✅ [AUTH_SERVICE] localStorage cleared')
      
      // Step 4: Clear sessionStorage
      console.log('🚪 [AUTH_SERVICE] Step 4: Clearing sessionStorage')
      const sessionStorageKeysBefore = Object.keys(sessionStorage)
      console.log('🗑️ [AUTH_SERVICE] sessionStorage keys before clear:', sessionStorageKeysBefore)
      sessionStorage.clear()
      console.log('✅ [AUTH_SERVICE] sessionStorage cleared')
      
      // Step 5: Attempt to clear IndexedDB (Firebase Auth persistence)
      console.log('🚪 [AUTH_SERVICE] Step 5: Attempting to clear IndexedDB')
      try {
        // Delete Firebase Auth IndexedDB databases
        const databases = await indexedDB.databases()
        console.log('🗑️ [AUTH_SERVICE] IndexedDB databases found:', databases.map(db => db.name))
        
        for (const db of databases) {
          if (db.name && (db.name.includes('firebase') || db.name.includes('auth'))) {
            console.log(`🗑️ [AUTH_SERVICE] Deleting IndexedDB database: ${db.name}`)
            indexedDB.deleteDatabase(db.name)
          }
        }
        console.log('✅ [AUTH_SERVICE] IndexedDB cleanup attempted')
      } catch (idbError) {
        console.warn('⚠️ [AUTH_SERVICE] IndexedDB cleanup failed (non-critical):', idbError)
      }
      
      // Step 6: Clear any app-specific reset functions
      console.log('🚪 [AUTH_SERVICE] Step 6: Triggering app-specific cleanup')
      if ((window as any).__resetUserStore) {
        console.log('🗑️ [AUTH_SERVICE] Calling __resetUserStore')
        ;(window as any).__resetUserStore()
      }
      
      // Step 7: Log completion and prepare for hard redirect
      console.log('✅ [AUTH_SERVICE] Absolute sign-out process completed')
      console.log('🔄 [AUTH_SERVICE] Preparing for hard redirect to /auth')
      
      // Note: The hard redirect should be handled by the caller to ensure proper timing
    } catch (error) {
      console.error('❌ [AUTH_SERVICE] Sign out error:', error)
      throw error
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      const user = firebaseUser ? await firebaseUserToDomainUser(firebaseUser) : null
      this.currentUser = user
      callback(user)
    })
  }

  async updateProfile(displayName: string): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }
    
    try {
      await updateProfile(this.auth.currentUser, { displayName })
      if (this.currentUser) {
        this.currentUser = { ...this.currentUser, displayName }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }
    
    try {
      await sendEmailVerification(this.auth.currentUser)
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  }

  isEmailVerified(): boolean {
    return this.auth.currentUser?.emailVerified || false
  }

  async refreshUser(): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }
    
    try {
      await reload(this.auth.currentUser)
      // Update current user data
      if (this.auth.currentUser) {
        this.currentUser = await firebaseUserToDomainUser(this.auth.currentUser)
      }
    } catch (error) {
      console.error('User refresh error:', error)
      throw error
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  /**
   * Get ID token result with claims (for admin verification)
   */
  async getIdTokenResult(): Promise<any> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }
    return getIdTokenResult(this.auth.currentUser)
  }

  /**
   * Force refresh ID token to get latest custom claims
   * Call this after admin claims are set via backend to propagate changes immediately
   */
  async forceTokenRefresh(): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('AUTH_ERROR: No authenticated user to refresh token')
    }

    try {
      console.log('[authService] Forcing token refresh to get latest claims')
      // Force refresh by passing true to get new token from server
      await this.auth.currentUser.getIdToken(true)
      // Reload user to update claims in the auth object
      await reload(this.auth.currentUser)
      // Update current user data with fresh claims
      if (this.auth.currentUser) {
        this.currentUser = await firebaseUserToDomainUser(this.auth.currentUser)
        console.log('[authService] Token refreshed successfully, claims updated')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('[authService] Token refresh error:', errorMessage)
      throw new Error(`TOKEN_REFRESH_ERROR: Failed to refresh token - ${errorMessage}`)
    }
  }

  /**
   * Get current auth token (for internal service use only)
   * Never exposed to UI components
   */
  async getCurrentToken(): Promise<string | null> {
    if (!this.auth.currentUser) return null
    return this.auth.currentUser.getIdToken()
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Handle common Firebase auth errors
      if (error.message.includes('auth/user-not-found')) {
        return 'User not found. Please check your email or sign up.'
      }
      if (error.message.includes('auth/wrong-password')) {
        return 'Incorrect password. Please try again.'
      }
      if (error.message.includes('auth/email-already-in-use')) {
        return 'Email already in use. Please sign in instead.'
      }
      if (error.message.includes('auth/weak-password')) {
        return 'Password is too weak. Please choose a stronger password.'
      }
      if (error.message.includes('auth/invalid-email')) {
        return 'Invalid email address.'
      }
      return error.message
    }
    return 'An unknown error occurred. Please try again.'
  }
}

/**
 * Create and export auth service instance
 */
export const authService = new FirebaseAuthService()

/**
 * Export auth service type for dependency injection
 */
export type { AuthService as IAuthService }
