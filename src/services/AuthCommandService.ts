import { authService } from './auth'
import { userStore } from '@/entities/user'
import type { User, RegisterUser } from '@/entities/user'
import type { IEventPublisher } from '@/shared/events/EventPublisher'
import { consoleEventPublisher } from '@/shared/events/ConsoleEventPublisher'
import { outboxManager } from '@/shared/events/OutboxManager'

/**
 * Base command interface for all auth commands with correlation tracking
 */
export interface AuthCommand {
  readonly type: string
  readonly correlationId: string
  readonly timestamp: string
  readonly payload: unknown
}

/**
 * Register User Command with correlation tracking
 */
export interface RegisterUserCommand extends AuthCommand {
  readonly type: 'REGISTER_USER'
  readonly payload: {
    readonly email: string
    readonly password: string
    readonly displayName: string
    readonly acceptTerms: boolean
  }
}

/**
 * Sign In Command with correlation tracking
 */
export interface SignInCommand extends AuthCommand {
  readonly type: 'SIGN_IN'
  readonly payload: {
    readonly email: string
    readonly password: string
  }
}

/**
 * Result interface with correlation tracking
 */
export interface AuthCommandResult<T = unknown> {
  readonly success: boolean
  readonly correlationId: string
  readonly timestamp: string
  readonly data?: T
  readonly error?: string
  readonly user?: User
}

/**
 * Helper utilities for correlation tracking
 */
export class CorrelationHelper {
  /**
   * Generate a unique correlation ID for command tracking
   */
  static generateCorrelationId(): string {
    return crypto.randomUUID()
  }

  /**
   * Generate ISO timestamp for command tracking
   */
  static generateTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * Create a command with correlation metadata
   */
  static createCommand<T extends AuthCommand>(
    type: T['type'],
    payload: T['payload']
  ): Omit<T, 'correlationId' | 'timestamp'> & {
    readonly correlationId: string
    readonly timestamp: string
  } {
    return {
      type,
      correlationId: this.generateCorrelationId(),
      timestamp: this.generateTimestamp(),
      payload,
    } as Omit<T, 'correlationId' | 'timestamp'> & {
      readonly correlationId: string
      readonly timestamp: string
    }
  }
}

/**
 * Auth Command Service - Decoupled authentication entry point
 * 
 * This service acts as an abstraction layer between UI components and the
 * underlying authentication implementation. It introduces correlation tracking
 * for all auth operations, enabling future migration to event-driven architecture.
 * 
 * Key Features:
 * - Correlation ID generation for all operations
 * - Consistent command structure
 * - Logging for debugging and audit trails
 * - Wraps existing Firebase auth without breaking changes
 */
export class AuthCommandService {
  /**
   * Create AuthCommandService with event publisher dependency
   * 
   * @param _publisher - Event publisher instance (defaults to console publisher)
   */
  constructor(_publisher: IEventPublisher = consoleEventPublisher) {
    // Publisher stored for future event publishing capabilities
  }

  /**
   * Register a new user with correlation tracking
   */
  async registerUser(command: RegisterUserCommand): Promise<AuthCommandResult<User>> {
    const { correlationId, timestamp, payload } = command
    
    console.log('🔐 [AUTH_COMMAND] Register user command initiated:', {
      correlationId,
      timestamp,
      email: payload.email,
      displayName: payload.displayName,
    })

    try {
      // Step 1: Execute Firebase authentication (wrapped)
      const firebaseResult = await authService.signUp(
        payload.email,
        payload.password,
        payload.displayName
      )

      if (!firebaseResult.success || !firebaseResult.user) {
        console.error('❌ [AUTH_COMMAND] Firebase registration failed:', {
          correlationId,
          error: firebaseResult.error,
        })

        return {
          success: false,
          correlationId,
          timestamp,
          error: firebaseResult.error || 'Registration failed',
        }
      }

      console.log('✅ [AUTH_COMMAND] Firebase auth successful:', {
        correlationId,
        userId: firebaseResult.user.id,
      })

      // Step 2: Create event-sourced registration command
      const registerCommand: RegisterUser = {
        type: 'user/register',
        tenant_id: firebaseResult.user.id,
        aggregate_id: `user_${firebaseResult.user.id}`,
        userId: firebaseResult.user.id,
        email: firebaseResult.user.email,
        displayName: firebaseResult.user.displayName,
        emailVerified: firebaseResult.user.emailVerified,
        createdAt: firebaseResult.user.createdAt,
      }

      console.log('🎮 [AUTH_COMMAND] Dispatching registration command:', {
        correlationId,
        command: registerCommand,
      })

      // Step 3: Commit to Event Store and Outbox atomically
      userStore.dispatch(registerCommand, registerCommand.tenant_id, registerCommand.aggregate_id)

      console.log('✅ [AUTH_COMMAND] Registration event committed successfully:', {
        correlationId,
        userId: firebaseResult.user.id,
      })

      // Step 4: Atomically publish to outbox (transactional)
      await outboxManager.publishSingleAtomically(
        'user.registered',
        {
          correlationId,
          timestamp: new Date().toISOString(),
          eventType: 'user.registered',
          payload: {
            userId: firebaseResult.user.id,
            email: firebaseResult.user.email,
            displayName: firebaseResult.user.displayName,
            emailVerified: firebaseResult.user.emailVerified,
            createdAt: firebaseResult.user.createdAt,
            tenant_id: firebaseResult.user.id, // Include for UserEventBus
            aggregate_id: `user_${firebaseResult.user.id}`, // Include for UserEventBus
          },
        },
        correlationId,
        firebaseResult.user.id, // Use user ID as tenant_id
        `user_${firebaseResult.user.id}` // Use user-specific aggregate
      )

      return {
        success: true,
        correlationId,
        timestamp,
        user: firebaseResult.user,
      }

    } catch (error) {
      console.error('💥 [AUTH_COMMAND] Unexpected error during registration:', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        correlationId,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Sign in user with correlation tracking
   */
  async signInUser(command: SignInCommand): Promise<AuthCommandResult<User>> {
    const { correlationId, timestamp, payload } = command

    console.log('🔐 [AUTH_COMMAND] Sign in command initiated:', {
      correlationId,
      timestamp,
      email: payload.email,
    })

    try {
      const result = await authService.signIn(payload.email, payload.password)

      if (!result.success || !result.user) {
        console.error('❌ [AUTH_COMMAND] Sign in failed:', {
          correlationId,
          error: result.error,
        })

        return {
          success: false,
          correlationId,
          timestamp,
          error: result.error || 'Sign in failed',
        }
      }

      // Check email verification
      if (!result.user.emailVerified) {
        console.warn('⚠️ [AUTH_COMMAND] Sign in blocked - email not verified:', {
          correlationId,
          userId: result.user.id,
        })

        return {
          success: false,
          correlationId,
          timestamp,
          error: 'Email not verified. Please check your inbox.',
        }
      }

      console.log('✅ [AUTH_COMMAND] Sign in successful:', {
        correlationId,
        userId: result.user.id,
      })

      return {
        success: true,
        correlationId,
        timestamp,
        user: result.user,
      }

    } catch (error) {
      console.error('💥 [AUTH_COMMAND] Unexpected error during sign in:', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        correlationId,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Sign out user with correlation tracking
   */
  async signOutUser(): Promise<AuthCommandResult<void>> {
    const correlationId = CorrelationHelper.generateCorrelationId()
    const timestamp = CorrelationHelper.generateTimestamp()

    console.log('🔐 [AUTH_COMMAND] Sign out command initiated:', {
      correlationId,
      timestamp,
    })

    try {
      await authService.signOut()

      console.log('✅ [AUTH_COMMAND] Sign out successful:', {
        correlationId,
      })

      return {
        success: true,
        correlationId,
        timestamp,
      }

    } catch (error) {
      console.error('💥 [AUTH_COMMAND] Unexpected error during sign out:', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        correlationId,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Send email verification with correlation tracking
   */
  async sendEmailVerification(): Promise<AuthCommandResult<void>> {
    const correlationId = CorrelationHelper.generateCorrelationId()
    const timestamp = CorrelationHelper.generateTimestamp()

    console.log('🔐 [AUTH_COMMAND] Send email verification command initiated:', {
      correlationId,
      timestamp,
    })

    try {
      await authService.sendEmailVerification()

      console.log('✅ [AUTH_COMMAND] Email verification sent:', {
        correlationId,
      })

      return {
        success: true,
        correlationId,
        timestamp,
      }

    } catch (error) {
      console.error('💥 [AUTH_COMMAND] Failed to send email verification:', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        correlationId,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

/**
 * Export singleton instance for application use
 * Uses console event publisher by default for development
 */
export const authCommandService = new AuthCommandService(consoleEventPublisher)

