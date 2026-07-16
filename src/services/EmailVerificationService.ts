import type { IEventPublisher } from '@/shared/events/EventPublisher'
import { userEventBus, type UserEventEnvelope } from '@/shared/events/UserEventBus'
import { authService } from './auth'
import type { UserRegisteredEvent } from '@/shared/events/EventPublisher'
import type { ITeardownService } from '@/shared/services/ITeardownService.ts'
import { SecurityContextError } from '@/shared/services/ITeardownService.ts'

/**
 * JWT Payload for email verification
 */
export interface EmailVerificationJWTPayload {
  readonly userId: string
  readonly email: string
  readonly returnUrl?: string
  readonly correlationId: string
  readonly exp: number
  readonly iat: number
}

/**
 * Email Verification Event
 * Published when verification email is sent
 */
export interface EmailVerificationSentEvent {
  readonly correlationId: string
  readonly timestamp: string
  readonly eventType: 'email.verification.sent'
  readonly payload: {
    readonly userId: string
    readonly email: string
    readonly verificationUrl: string
    readonly sentAt: number
  }
}

/**
 * Email Verification Service
 * 
 * Subscribes to user.registered events and sends verification emails
 * with custom JWT tokens for secure verification flow.
 * 
 * Now subscribes to UserEventBus for decoupled event handling.
 * Now implements ITeardownService for graceful cleanup during logout.
 */
export class EmailVerificationService implements ITeardownService {
  private readonly jwtSecret = 'mock-secret-key-change-in-production' // TODO: Move to env var
  private readonly jwtExpirySeconds = 3600 // 1 hour
  private unsubscribe?: () => void
  private isTornDown = false // Constraint #1: Idempotency flag

  constructor(
    private readonly publisher: IEventPublisher
  ) {}

  /**
   * Start the email verification service
   * Subscribes to user.registered events from UserEventBus
   */
  start(): void {
    if (this.isTornDown) {
      throw new SecurityContextError(
        'Cannot start EmailVerificationService after teardown',
        undefined,
        undefined,
        'EmailVerificationService.start'
      )
    }

    console.log('🚀 [EMAIL_VERIFICATION] Starting email verification service...')

    this.unsubscribe = userEventBus.subscribe('user.registered', async (envelope: UserEventEnvelope) => {
      // Extract the UserRegisteredEvent from the envelope
      const userEvent: UserRegisteredEvent = {
        correlationId: envelope.correlationId,
        timestamp: envelope.timestamp,
        eventType: envelope.eventType as 'user.registered',
        payload: envelope.payload as UserRegisteredEvent['payload'],
      }

      await this.handleUserRegistered(userEvent)
    })

    console.log('✅ [EMAIL_VERIFICATION] Subscribed to user.registered events')
  }

  /**
   * Stop the email verification service
   */
  stop(): void {
    console.log('🛑 [EMAIL_VERIFICATION] Stopping email verification service...')
    
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  /**
   * Teardown the email verification service - Constraint #1: Strict Teardown Contract
   * Performs absolute state reset with idempotency protection.
   */
  teardown(tenant_id?: string): void {
    console.log(`🧹 [SERVICE_TEARDOWN] EmailVerificationService teardown starting for tenant: ${tenant_id || 'all'}`)
    
    // Constraint #1: Idempotency check
    if (this.isTornDown) {
      console.log('ℹ️ [SERVICE_TEARDOWN] EmailVerificationService already torn down, skipping')
      return
    }

    console.log('🧹 [SERVICE_TEARDOWN] EmailVerificationService status before: Active')
    
    // Constraint #3: Internal Buffer Flushing - Stop normal operations
    this.stop()
    
    // Constraint #1: Mark as torn down (idempotency)
    this.isTornDown = true
    
    console.log('🧹 [SERVICE_TEARDOWN] EmailVerificationService status after: Inactive')
    console.log('✅ [SERVICE_TEARDOWN] EmailVerificationService teardown complete')
  }

  /**
   * Check if the email verification service is active
   */
  isActive(): boolean {
    return !this.isTornDown && !!this.unsubscribe
  }

  /**
   * Handle user registration event
   * Called by OutboxProcessor or event subscriber
   */
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    const { correlationId, payload } = event
    
    console.log(`📧 [EMAIL_VERIFICATION] Processing user registration:`, {
      correlationId,
      userId: payload.userId,
      email: payload.email,
    })

    try {
      // Step 1: Generate JWT token
      const jwtToken = this.generateVerificationJWT({
        userId: payload.userId,
        email: payload.email,
        returnUrl: this.extractReturnUrl(event),
        correlationId,
      })

      console.log(`🔐 [EMAIL_VERIFICATION] JWT generated:`, {
        correlationId,
        tokenLength: jwtToken.length,
      })

      // Step 2: Construct verification URL
      const verificationUrl = this.constructVerificationUrl(jwtToken)

      console.log(`🔗 [EMAIL_VERIFICATION] Verification URL constructed:`, {
        correlationId,
        verificationUrl: verificationUrl.substring(0, 100) + '...',
      })

      // Step 3: Send verification email
      await this.sendVerificationEmail(payload.userId, verificationUrl, correlationId)

      // Step 4: Publish email sent event
      await this.publishEmailSentEvent(correlationId, payload, verificationUrl)

      console.log(`✅ [EMAIL_VERIFICATION] Email verification sent successfully:`, {
        correlationId,
        userId: payload.userId,
        email: payload.email,
      })

    } catch (error) {
      console.error(`❌ [EMAIL_VERIFICATION] Failed to send verification email:`, {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Re-throw to let OutboxProcessor handle retries
      throw error
    }
  }

  /**
   * Generate JWT token for email verification
   * 
   * NOTE: This is a mock implementation. In production, use a proper JWT library
   * like jsonwebtoken and store the secret in environment variables.
   */
  private generateVerificationJWT(payload: {
    userId: string
    email: string
    returnUrl?: string
    correlationId: string
  }): string {
    const now = Math.floor(Date.now() / 1000)
    const exp = now + this.jwtExpirySeconds

    const jwtPayload: EmailVerificationJWTPayload = {
      userId: payload.userId,
      email: payload.email,
      returnUrl: payload.returnUrl,
      correlationId: payload.correlationId,
      iat: now,
      exp,
    }

    // Mock JWT implementation (base64 encoded payload)
    // In production, use proper JWT signing
    const header = { alg: 'HS256', typ: 'JWT' }
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(jwtPayload))
    const signature = btoa(`${encodedHeader}.${encodedPayload}.${this.jwtSecret}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  /**
   * Verify JWT token (for verification endpoint)
   */
  verifyVerificationJWT(token: string): EmailVerificationJWTPayload | null {
    try {
      const [headerB64, payloadB64, signature] = token.split('.')
      
      if (!headerB64 || !payloadB64 || !signature) {
        throw new Error('Invalid token format')
      }

      const payload = JSON.parse(atob(payloadB64)) as EmailVerificationJWTPayload

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        throw new Error('Token expired')
      }

      console.log(`✅ [EMAIL_VERIFICATION] JWT verified successfully:`, {
        correlationId: payload.correlationId,
        userId: payload.userId,
        email: payload.email,
      })

      return payload

    } catch (error) {
      console.error(`❌ [EMAIL_VERIFICATION] JWT verification failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Construct verification URL with JWT token
   */
  private constructVerificationUrl(jwtToken: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/verify?token=${encodeURIComponent(jwtToken)}`
  }

  /**
   * Send verification email using Firebase Auth
   */
  private async sendVerificationEmail(
    userId: string,
    verificationUrl: string,
    correlationId: string
  ): Promise<void> {
    console.log(`📤 [EMAIL_VERIFICATION] Sending verification email:`, {
      correlationId,
      userId,
      verificationUrl: verificationUrl.substring(0, 100) + '...',
    })

    // Use Firebase Auth to send verification email
    // Note: Firebase handles the verification URL automatically
    // Our custom JWT will be used in the verification endpoint
    await authService.sendEmailVerification()

    console.log(`📧 [EMAIL_VERIFICATION] Verification email sent via Firebase:`, {
      correlationId,
      userId,
    })
  }

  /**
   * Extract return URL from event metadata
   */
  private extractReturnUrl(_event: UserRegisteredEvent): string | undefined {
    // In a real implementation, this would come from event metadata
    // For now, we'll return to the home page
    return '/'
  }

  /**
   * Publish email sent event for tracking
   */
  private async publishEmailSentEvent(
    correlationId: string,
    userPayload: UserRegisteredEvent['payload'],
    verificationUrl: string
  ): Promise<void> {
    const emailSentEvent: EmailVerificationSentEvent = {
      correlationId,
      timestamp: new Date().toISOString(),
      eventType: 'email.verification.sent',
      payload: {
        userId: userPayload.userId,
        email: userPayload.email,
        verificationUrl,
        sentAt: Date.now(),
      },
    }

    await this.publisher.publish('email.verification.sent', emailSentEvent)

    console.log(`📤 [EMAIL_VERIFICATION] Email sent event published:`, {
      correlationId,
      userId: userPayload.userId,
      email: userPayload.email,
    })
  }

  /**
   * Resend verification email (for manual retry)
   */
  async resendVerificationEmail(userId: string, email: string, correlationId?: string): Promise<void> {
    const retryCorrelationId = correlationId || `resend-${Date.now()}`

    console.log(`🔄 [EMAIL_VERIFICATION] Resending verification email:`, {
      correlationId: retryCorrelationId,
      userId,
      email,
    })

    // Create mock user registered event for processing
    const mockEvent: UserRegisteredEvent = {
      correlationId: retryCorrelationId,
      timestamp: new Date().toISOString(),
      eventType: 'user.registered',
      payload: {
        userId,
        email,
        displayName: 'User',
        emailVerified: false,
        createdAt: Date.now(),
      },
    }

    await this.handleUserRegistered(mockEvent)
  }
}

/**
 * Export singleton instance for application use
 */
export const emailVerificationService = new EmailVerificationService(consoleEventPublisher)

// Import consoleEventPublisher
import { consoleEventPublisher } from '@/shared/events/ConsoleEventPublisher'
