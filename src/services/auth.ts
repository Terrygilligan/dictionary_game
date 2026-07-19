import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  reload,
  getIdTokenResult,
  type User as FirebaseUser
} from 'firebase/auth'
import { getFirebaseAuth } from '@/shared/api/firebase'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { User, UserClaims } from '@/entities/user'
import { createLogger } from '@/shared/lib/logger'
import { guestSessionService } from './GuestSessionService'

const logger = createLogger('AUTH_SERVICE')

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
  resetPassword(email: string, resetLink?: string): Promise<void>
  
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
    logger.log('Extracting claims for user:', firebaseUser.uid)
    const idTokenResult = await getIdTokenResult(firebaseUser)
    const claims = idTokenResult.claims || {}
    
    logger.log('Raw IdTokenResult claims:', JSON.stringify(claims, null, 2))
    logger.log('superadmin claim value:', claims.superadmin)
    logger.log('admin claim value:', claims.admin)
    
    const extractedClaims = {
      superadmin: claims.superadmin === true,
      admin: claims.admin === true,
    }
    
    logger.log('Extracted claims:', extractedClaims)
    return extractedClaims
  } catch (error) {
    logger.error('Failed to extract user claims:', error)
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
  private firestore = getFirestore()

  /**
   * Helper function to write email requests to email_queue collection
   * DEPRECATED: This method is being decommissioned in favor of the outbox pattern.
   * Email operations now go through: outbox → OutboxProcessor → EmailTemplateService → Resend
   * 
   * TODO: After confirming no in-flight emails remain in email_queue collection, remove this method entirely
   * TODO: For password_reset and email_verification, need to add outbox integration before full deprecation
   */
  private async queueEmail(email: string, template: string, additionalData?: Record<string, any>): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }

    try {
      const emailQueueRef = collection(this.firestore, 'email_queue')
      await addDoc(emailQueueRef, {
        email,
        userId: this.auth.currentUser.uid,
        template,
        data: additionalData || {},
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      logger.log(`Email queued successfully: ${template} for ${email}`)
    } catch (error) {
      logger.error('Failed to queue email:', error)
      throw error
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
      
      // Reset guest session when user signs in
      guestSessionService.resetSession()
      logger.log('Guest session reset on sign in')
      
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
      logger.error('Sign in error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password)

      // Reset guest session when user signs up
      guestSessionService.resetSession()
      logger.log('Guest session reset on sign up')

      // Update display name
      await updateProfile(userCredential.user, { displayName })

      const user = await firebaseUserToDomainUser(userCredential.user)
      this.currentUser = user

      // Get token for internal use
      const token = await userCredential.user.getIdToken()

      // Queue welcome/verification email for new user
      // DEPRECATED: Email operations now use outbox pattern instead of queueEmail
      // The user.registered event is already published via AuthCommandService.registerUser()
      // which triggers the OutboxProcessor → EmailTemplateService → Resend flow
      try {
        // await this.queueEmail(email, 'welcome_registration', { username: displayName })
        logger.log('Welcome email skipped - using outbox pattern via AuthCommandService:', email)
      } catch (emailError) {
        // Don't fail signup if email queue fails, but log the error
        logger.error('Failed to queue welcome email:', emailError)
      }

      // 🔍 DEBUG LOG: User registration event
      logger.log('USER_REGISTERED event triggered:', {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      })

      // 🎯 Emit USER_REGISTERED event to projection system
      // TODO: Re-implement projection service or use alternative approach
      logger.log('User registered:', {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })

      return {
        success: true,
        user,
        token, // For internal auth service use only
      }
    } catch (error) {
      logger.error('Sign up error:', error)
      return {
        success: false,
        error: this.getErrorMessage(error),
      }
    }
  }

  async signOut(): Promise<void> {
    logger.log('Starting absolute sign-out process')
    
    try {
      // Step 1: Call Firebase signOut
      logger.log('Step 1: Calling Firebase signOut')
      await signOut(this.auth)
      logger.log('Firebase signOut successful')
      
      // Step 2: Clear local state
      logger.log('Step 2: Clearing local user state')
      this.currentUser = null
      logger.log('Local user state cleared')
      
      // Step 3: Clear localStorage
      logger.log('Step 3: Clearing localStorage')
      const localStorageKeysBefore = Object.keys(localStorage)
      logger.log('localStorage keys before clear:', localStorageKeysBefore)
      localStorage.clear()
      logger.log('localStorage cleared')
      
      // Step 4: Clear sessionStorage
      logger.log('Step 4: Clearing sessionStorage')
      const sessionStorageKeysBefore = Object.keys(sessionStorage)
      logger.log('sessionStorage keys before clear:', sessionStorageKeysBefore)
      sessionStorage.clear()
      logger.log('sessionStorage cleared')
      
      // Step 5: Attempt to clear IndexedDB (Firebase Auth persistence)
      logger.log('Step 5: Attempting to clear IndexedDB')
      try {
        // Delete Firebase Auth IndexedDB databases
        const databases = await indexedDB.databases()
        logger.log('IndexedDB databases found:', databases.map(db => db.name))
        
        for (const db of databases) {
          if (db.name && (db.name.includes('firebase') || db.name.includes('auth'))) {
            logger.log(`Deleting IndexedDB database: ${db.name}`)
            indexedDB.deleteDatabase(db.name)
          }
        }
        logger.log('IndexedDB cleanup attempted')
      } catch (idbError) {
        logger.warn('IndexedDB cleanup failed (non-critical):', idbError)
      }
      
      // Step 6: Clear any app-specific reset functions
      logger.log('Step 6: Triggering app-specific cleanup')
      if ((window as any).__resetUserStore) {
        logger.log('Calling __resetUserStore')
        ;(window as any).__resetUserStore()
      }
      
      // Step 7: Log completion and prepare for hard redirect
      logger.log('Absolute sign-out process completed')
      logger.log('Preparing for hard redirect to /auth')
      
      // Note: The hard redirect should be handled by the caller to ensure proper timing
    } catch (error) {
      logger.error('Sign out error:', error)
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
      logger.error('Profile update error:', error)
      throw error
    }
  }

  async resetPassword(email: string, resetLink?: string): Promise<void> {
    try {
      // Queue password reset email instead of calling Firebase directly
      await this.queueEmail(email, 'password_reset', { resetLink })
      logger.log('Password reset email queued for:', email)
    } catch (error) {
      logger.error('Password reset error:', error)
      throw error
    }
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user')
    }

    try {
      // Queue email verification instead of calling Firebase directly
      await this.queueEmail(this.auth.currentUser.email || '', 'email_verification')
      logger.log('Email verification queued for:', this.auth.currentUser.email)
    } catch (error) {
      logger.error('Email verification error:', error)
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
      logger.error('User refresh error:', error)
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
      logger.log('Forcing token refresh to get latest claims')
      // Force refresh by passing true to get new token from server
      await this.auth.currentUser.getIdToken(true)
      // Reload user to update claims in the auth object
      await reload(this.auth.currentUser)
      // Update current user data with fresh claims
      if (this.auth.currentUser) {
        this.currentUser = await firebaseUserToDomainUser(this.auth.currentUser)
        logger.log('Token refreshed successfully, claims updated')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Token refresh error:', errorMessage)
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
