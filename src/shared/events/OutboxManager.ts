import { getFirestoreDB } from '@/shared/api/firebase'
import { doc, collection, runTransaction, Timestamp, getDoc } from 'firebase/firestore'

/**
 * Outbox Document interface
 * Defines the structure of outbox entries for transactional event publishing
 */
export interface OutboxDocument {
  id: string
  topic: string
  eventType: string
  timestamp: string
  payload: unknown
  correlationId: string
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  createdAt: number
  attempts: number
}

/**
 * Outbox Manager
 *
 * Handles atomic operations between domain events and outbox entries
 * using Firestore transactions to ensure exactly-once semantics.
 */
export class OutboxManager {
  private readonly db = getFirestoreDB()
  private readonly outboxCollection = collection(this.db, 'outbox')

  /**
   * Atomically commit domain events and outbox entries
   * 
   * @param events - Array of events to commit
   * @param tenant_id - Tenant identifier
   * @param aggregate_id - Aggregate identifier
   * @returns Promise that resolves when transaction commits
   */
  async publishAtomically(
    events: Array<{
      topic: string
      payload: unknown
      correlationId: string
    }>,
    _tenant_id: string,
    _aggregate_id: string
  ): Promise<void> {
    console.log(`🔄 [OUTBOX_MANAGER] Starting atomic transaction for ${events.length} events`)

    await runTransaction(this.db, async (transaction) => {
      const now = Timestamp.now()
      const outboxEntries: OutboxDocument[] = []

      // Create outbox entries for each event
      for (const event of events) {
        const outboxDoc: OutboxDocument = {
          id: event.correlationId, // Use correlation ID as document ID for idempotency
          topic: event.topic,
          eventType: event.topic, // Add eventType at root level for event-sourced pattern
          timestamp: new Date().toISOString(), // Add timestamp at root level for audit trail
          payload: event.payload,
          correlationId: event.correlationId,
          status: 'PENDING',
          createdAt: now.toMillis(),
          attempts: 0,
        }

        outboxEntries.push(outboxDoc)

        // Create document reference
        const outboxRef = doc(this.outboxCollection, event.correlationId)
        
        // Add to transaction
        transaction.set(outboxRef, outboxDoc)

        console.log(`📦 [OUTBOX_MANAGER] Added to transaction: ${event.topic} (${event.correlationId})`)
      }

      console.log(`✅ [OUTBOX_MANAGER] Transaction prepared with ${outboxEntries.length} outbox entries`)
    })

    console.log(`✅ [OUTBOX_MANAGER] Atomic transaction committed successfully`)
  }

  /**
   * Publish a single event atomically
   * 
   * @param topic - Event topic
   * @param payload - Event payload
   * @param correlationId - Correlation ID (used as document ID)
   * @param tenant_id - Tenant identifier
   * @param aggregate_id - Aggregate identifier
   */
  async publishSingleAtomically(
    topic: string,
    payload: unknown,
    correlationId: string,
    tenant_id: string,
    aggregate_id: string
  ): Promise<void> {
    await this.publishAtomically([{
      topic,
      payload,
      correlationId
    }], tenant_id, aggregate_id)
  }

  /**
   * Check if an event with the given correlation ID already exists
   * Used for idempotency checks
   * 
   * @param correlationId - Correlation ID to check
   * @returns Promise<boolean> - True if event exists
   */
  async eventExists(correlationId: string): Promise<boolean> {
    const outboxRef = doc(this.outboxCollection, correlationId)
    const snapshot = await getDoc(outboxRef)
    
    return snapshot.exists()
  }

  /**
   * Get outbox document by correlation ID
   * 
   * @param correlationId - Correlation ID
   * @returns Promise<OutboxDocument | null>
   */
  async getOutboxDocument(correlationId: string): Promise<OutboxDocument | null> {
    const outboxRef = doc(this.outboxCollection, correlationId)
    const snapshot = await getDoc(outboxRef)
    
    if (!snapshot.exists()) return null
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as OutboxDocument
  }
}


/**
 * Export singleton instance for application use
 */
export const outboxManager = new OutboxManager()
