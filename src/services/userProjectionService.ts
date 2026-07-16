import { userEventBus, type UserEventEnvelope } from '@/shared/events/UserEventBus'
import { getFirestoreDB } from '@/shared/api/firebase'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { encryptUserProfile } from '@/shared/lib/security/cryptoShreddingBrowser'
import type { UserRegisteredEvent } from '@/shared/events/EventPublisher'
import type { ITeardownService } from '@/shared/services/ITeardownService.ts'
import { SecurityContextError } from '@/shared/services/ITeardownService.ts'

/**
 * User Projection Service
 * 
 * Projects user registration events to Firestore for queryable read models.
 * Maintains multi-tenant isolation by preserving tenant_id and aggregate_id
 * from event envelopes. Applies GDPR encryption before writing sensitive data.
 * 
 * Architectural Compliance:
 * - Event-Sourcing: Subscribes to user.registered events from UserEventBus
 * - Multi-Tenant: Preserves tenant_id and aggregate_id in Firestore documents
 * - GDPR: Encrypts sensitive fields (email, displayName) before storage
 * - Idempotent: Uses setDoc with merge: true to prevent overwrites
 * 
 * Now implements ITeardownService for graceful cleanup during logout.
 */
export class UserProjectionService implements ITeardownService {
  private readonly db = getFirestoreDB()
  private readonly usersCollection = 'users'
  private unsubscribe?: () => void
  private isTornDown = false // Constraint #1: Idempotency flag

  /**
   * Start the projection service
   * Subscribes to user.registered events and projects them to Firestore
   */
  start(): void {
    if (this.isTornDown) {
      throw new SecurityContextError(
        'Cannot start UserProjectionService after teardown',
        undefined,
        undefined,
        'UserProjectionService.start'
      )
    }

    console.log('🚀 [USER_PROJECTION] Starting user projection service...')

    this.unsubscribe = userEventBus.subscribe('user.registered', async (envelope: UserEventEnvelope) => {
      await this.handleUserRegistered(envelope)
    })

    console.log('✅ [USER_PROJECTION] Subscribed to user.registered events')
  }

  /**
   * Stop the projection service
   */
  stop(): void {
    console.log('🛑 [USER_PROJECTION] Stopping user projection service...')
    
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  /**
   * Teardown the user projection service - Constraint #1: Strict Teardown Contract
   * Performs absolute state reset with idempotency protection.
   */
  teardown(tenant_id?: string): void {
    console.log(`🧹 [SERVICE_TEARDOWN] UserProjectionService teardown starting for tenant: ${tenant_id || 'all'}`)
    
    // Constraint #1: Idempotency check
    if (this.isTornDown) {
      console.log('ℹ️ [SERVICE_TEARDOWN] UserProjectionService already torn down, skipping')
      return
    }

    console.log('🧹 [SERVICE_TEARDOWN] UserProjectionService status before: Active')
    
    // Constraint #3: Internal Buffer Flushing - Stop normal operations
    this.stop()
    
    // Constraint #1: Mark as torn down (idempotency)
    this.isTornDown = true
    
    console.log('🧹 [SERVICE_TEARDOWN] UserProjectionService status after: Inactive')
    console.log('✅ [SERVICE_TEARDOWN] UserProjectionService teardown complete')
  }

  /**
   * Check if the user projection service is active
   */
  isActive(): boolean {
    return !this.isTornDown && !!this.unsubscribe
  }

  /**
   * Handle user registered event
   * Projects user data to Firestore with encryption and multi-tenant metadata
   */
  private async handleUserRegistered(envelope: UserEventEnvelope): Promise<void> {
    const { tenant_id, aggregate_id, correlationId, payload } = envelope
    
    console.log(`📊 [USER_PROJECTION] Processing user registration:`, {
      correlationId,
      tenant_id,
      aggregate_id,
      userId: (payload as UserRegisteredEvent['payload']).userId,
    })

    try {
      const userPayload = payload as UserRegisteredEvent['payload']
      const userId = userPayload.userId

      // Prepare user document with GDPR encryption
      const userProfile = {
        email: userPayload.email,
        displayName: userPayload.displayName,
        emailVerified: userPayload.emailVerified,
        createdAt: userPayload.createdAt,
        // Multi-tenant metadata
        tenant_id,
        aggregate_id,
        // Audit metadata
        correlationId,
        projectedAt: serverTimestamp(),
        /**
         * Encryption key ID for crypto-shredding (future implementation)
         * TODO: Store encryption_key_id from envelope to enable key-based deletion
         * See SCRATCHPAD.md entry 0013 for GDPR & Crypto-Shredding Readiness
         */
        // encryption_key_id: envelope.encryption_key_id,
      }

      // Encrypt sensitive fields before writing to Firestore
      const encryptedProfile = await encryptUserProfile(userProfile)

      // Write to Firestore with merge semantics to prevent overwrites
      const userRef = doc(this.db, this.usersCollection, userId)
      await setDoc(userRef, encryptedProfile, { merge: true })

      console.log(`✅ [USER_PROJECTION] User document created/updated in Firestore:`, {
        userId,
        tenant_id,
        aggregate_id,
        correlationId,
      })

    } catch (error) {
      console.error(`❌ [USER_PROJECTION] Failed to project user to Firestore:`, {
        correlationId,
        tenant_id,
        aggregate_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Re-throw to allow error handling by caller
      throw error
    }
  }

  /**
   * Get user document by ID (for testing/validation)
   */
  async getUserDocument(userId: string): Promise<any> {
    const userRef = doc(this.db, this.usersCollection, userId)
    const snapshot = await getDoc(userRef)
    
    if (!snapshot.exists()) {
      return null
    }

    return snapshot.data()
  }
}

/**
 * Export singleton instance for application use
 */
export const userProjectionService = new UserProjectionService()
