import { gameEventBus, type GameEventEnvelope } from '@/entities/game/model/GameEventBus'
import { getFirestoreDB } from '@/shared/api/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Game Audit Service
 * 
 * Subscribes to all game events and writes them to a dedicated audit collection
 * for comprehensive event tracking and multi-tenant isolation enforcement.
 * 
 * Architectural Compliance:
 * - Event-Driven: Subscribes to GameEventBus for all game events
 * - Multi-Tenant: Preserves tenant_id and aggregate_id in audit logs
 * - GDPR Ready: Prepared for encryption_key_id field integration
 * - Fail-Fast: Strict validation of identity metadata
 * - Audit Trail: Complete correlation tracking for all game actions
 */
export class GameAuditService {
  private readonly db = getFirestoreDB()
  private readonly auditCollection = 'game_event_logs'
  private unsubscribe?: () => void

  /**
   * Start the audit service
   * Subscribes to all game events and logs them to Firestore
   */
  start(): void {
    console.log('🎮 [GAME_AUDIT] Starting game audit service...')

    this.unsubscribe = gameEventBus.subscribeAll(async (envelope: GameEventEnvelope) => {
      await this.handleGameEvent(envelope)
    })

    console.log('✅ [GAME_AUDIT] Subscribed to all game events')
  }

  /**
   * Stop the audit service
   */
  stop(): void {
    console.log('🛑 [GAME_AUDIT] Stopping game audit service...')
    
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  /**
   * Handle game event
   * Validates envelope and writes to Firestore audit collection
   */
  private async handleGameEvent(envelope: GameEventEnvelope): Promise<void> {
    // Strict validation: Fail-fast if identity metadata missing
    this.validateEnvelope(envelope)

    const { tenant_id, aggregate_id, correlationId, type } = envelope

    console.log(`📊 [GAME_AUDIT] Logging game event:`, {
      correlationId,
      eventType: type,
      tenant_id,
      aggregate_id,
    })

    try {
      // Generate unique document ID for this audit entry
      const auditId = `audit_${correlationId}_${Date.now()}`
      const auditRef = doc(this.db, this.auditCollection, auditId)

      // Write audit entry with server timestamp
      await setDoc(auditRef, {
        ...envelope,
        auditId,
        projectedAt: serverTimestamp(),
      })

      console.log(`✅ [GAME_AUDIT] Game event logged to Firestore:`, {
        auditId,
        eventType: type,
        tenant_id,
        aggregate_id,
      })
    } catch (error) {
      console.error(`❌ [GAME_AUDIT] Failed to log game event to Firestore:`, {
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
   * Validate event envelope
   * Strict validation to ensure multi-tenant isolation compliance
   */
  private validateEnvelope(envelope: GameEventEnvelope): void {
    const { tenant_id, aggregate_id, correlationId, type } = envelope

    if (!tenant_id || tenant_id.trim() === '' || tenant_id === 'default') {
      throw new Error(
        `GAME_AUDIT_VALIDATION_ERROR: Invalid or missing tenant_id in game event envelope. ` +
        `Value: "${tenant_id}". ` +
        `This violates multi-tenant enforcement directive.`
      )
    }

    if (!aggregate_id || aggregate_id.trim() === '' || aggregate_id === 'default') {
      throw new Error(
        `GAME_AUDIT_VALIDATION_ERROR: Invalid or missing aggregate_id in game event envelope. ` +
        `Value: "${aggregate_id}". ` +
        `This violates multi-tenant enforcement directive.`
      )
    }

    if (!correlationId || correlationId.trim() === '') {
      throw new Error(
        `GAME_AUDIT_VALIDATION_ERROR: Missing correlationId in game event envelope. ` +
        `This breaks audit trail continuity.`
      )
    }

    if (!type || type.trim() === '') {
      throw new Error(
        `GAME_AUDIT_VALIDATION_ERROR: Missing event type in game event envelope. ` +
        `Value: "${type}"`
      )
    }
  }
}

/**
 * Export singleton instance for application use
 */
export const gameAuditService = new GameAuditService()
