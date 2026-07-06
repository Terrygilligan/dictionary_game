import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  type User as FirebaseUser
} from 'firebase/auth'
import { getFirebaseAuth } from '@/shared/api/firebase'
import type { User } from '@/entities/user'
import { userProjectionService } from './userProjectionService'

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
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
  /** For internal use only - never exposed to UI */
  token?: string
}

/**
 * Convert Firebase User to domain User entity
 */
function firebaseUserToDomainUser(firebaseUser: FirebaseUser): User {
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
      const user = firebaseUserToDomainUser(userCredential.user)
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
      await sendEmailVerification(userCredential.user)
      
      const user = firebaseUserToDomainUser(userCredential.user)
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
      try {
        await userProjectionService.processUserEvent({
          type: 'user/registered',
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        })
        console.log('✅ [AUTH] USER_REGISTERED event processed by projection service')
      } catch (error) {
        console.error('❌ [AUTH] Failed to process USER_REGISTERED event:', error)
        // Don't fail the signup if projection fails, but log the error
      }
      
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
    try {
      await signOut(this.auth)
      this.currentUser = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (firebaseUser) => {
      const user = firebaseUser ? firebaseUserToDomainUser(firebaseUser) : null
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
        this.currentUser = firebaseUserToDomainUser(this.auth.currentUser)
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
