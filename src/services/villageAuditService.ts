import { villageEventBus, type VillageEventEnvelope } from '@/entities/village/model/VillageEventBus'
import { getFirestoreDB } from '@/shared/api/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Village Audit Service
 *
 * Subscribes to all village events and writes them to a dedicated audit collection
 * for comprehensive event tracking and multi-tenant isolation enforcement.
 *
 * Architectural Compliance:
 * - Event-Driven: Subscribes to VillageEventBus for all village events
 * - Multi-Tenant: Preserves tenant_id and aggregate_id in audit logs
 * - GDPR Ready: Prepared for encryption_key_id field integration
 * - Fail-Fast: Strict validation of identity metadata
 * - Audit Trail: Complete correlation tracking for all village actions
 */
export class VillageAuditService {
  private readonly db = getFirestoreDB()
  private readonly auditCollection = 'village_event_logs'
  private unsubscribe?: () => void

  /**
   * Start the audit service
   * Subscribes to all village events and logs them to Firestore
   */
  start(): void {
    console.log('🏘️ [VILLAGE_AUDIT] Starting village audit service...')

    this.unsubscribe = villageEventBus.subscribeAll(async (envelope: VillageEventEnvelope) => {
      await this.handleVillageEvent(envelope)
    })

    console.log('✅ [VILLAGE_AUDIT] Subscribed to all village events')
  }

  /**
   * Stop the audit service
   */
  stop(): void {
    console.log('🛑 [VILLAGE_AUDIT] Stopping village audit service...')

    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  /**
   * Handle village event
   * Validates envelope and writes to Firestore audit collection
   */
  private async handleVillageEvent(envelope: VillageEventEnvelope): Promise<void> {
    // Strict validation: Fail-fast if identity metadata missing
    this.validateEnvelope(envelope)

    const { tenant_id, aggregate_id, correlationId, type } = envelope

    console.log(`📊 [VILLAGE_AUDIT] Logging village event:`, {
      correlationId,
      eventType: type,
      tenant_id,
      aggregate_id,
    })

    try {
      // Generate unique document ID for this audit entry
      const auditId = `village_audit_${correlationId}_${Date.now()}`
      const auditRef = doc(this.db, this.auditCollection, auditId)

      // Write audit entry with server timestamp
      await setDoc(auditRef, {
        ...envelope,
        auditId,
        projectedAt: serverTimestamp(),
      })

      console.log(`✅ [VILLAGE_AUDIT] Village event logged to Firestore:`, {
        auditId,
        eventType: type,
        tenant_id,
        aggregate_id,
      })
    } catch (error) {
      console.error(`❌ [VILLAGE_AUDIT] Failed to log village event to Firestore:`, {
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
  private validateEnvelope(envelope: VillageEventEnvelope): void {
    const { tenant_id, aggregate_id, correlationId, type } = envelope

    if (!tenant_id || tenant_id.trim() === '' || tenant_id === 'default') {
      throw new Error(
        `VILLAGE_AUDIT_VALIDATION_ERROR: Invalid or missing tenant_id in village event envelope. ` +
        `Value: "${tenant_id}". ` +
        `This violates multi-tenant enforcement directive.`
      )
    }

    if (!aggregate_id || aggregate_id.trim() === '' || aggregate_id === 'default') {
      throw new Error(
        `VILLAGE_AUDIT_VALIDATION_ERROR: Invalid or missing aggregate_id in village event envelope. ` +
        `Value: "${aggregate_id}". ` +
        `This violates multi-tenant enforcement directive.`
      )
    }

    if (!correlationId || correlationId.trim() === '') {
      throw new Error(
        `VILLAGE_AUDIT_VALIDATION_ERROR: Missing correlationId in village event envelope. ` +
        `This breaks audit trail continuity.`
      )
    }

    if (!type || type.trim() === '') {
      throw new Error(
        `VILLAGE_AUDIT_VALIDATION_ERROR: Missing event type in village event envelope. ` +
        `Value: "${type}"`
      )
    }
  }
}

/**
 * Export singleton instance for application use
 */
export const villageAuditService = new VillageAuditService()
