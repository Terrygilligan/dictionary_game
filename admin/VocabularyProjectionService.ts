/**
 * Vocabulary Projection Service
 * 
 * Monitors the outbox for vocabulary events and projects them into the
 * vocabulary_definitions read-model collection.
 * 
 * Architectural Compliance:
 * - Separation of Concerns: Separate from monolithic OutboxProcessor
 * - Event Filtering: Only processes vocabulary/ events
 * - Deterministic Projection: Predictable read-model updates
 * - Dead Letter Pattern: Failed projections logged to projection_errors
 * - Idempotency: Transactional writes ensure consistency
 */

import admin from 'firebase-admin'
import type { VocabularyEvent, WordDefinitionAdded, WordDefinitionRemoved } from '../src/entities/vocabulary/model/events.js'
import type { ITeardownService } from '../src/shared/services/ITeardownService.js'
import type {
  OutboxDocument,
  ProjectionError,
  VocabularyDefinitionDocument,
  VocabularyProjectionConfig
} from '../src/entities/vocabulary/projection/types.js'

const DEFAULT_CONFIG: VocabularyProjectionConfig = {
  enabled: true,
  maxRetries: 3,
  retryDelayMs: 2000,
  batchSize: 10,
  pollingIntervalMs: 5000,
}

/**
 * Vocabulary Projection Service
 * 
 * Projects vocabulary events from outbox to vocabulary_definitions collection.
 * Implements dead letter pattern for failed projections.
 */
export class VocabularyProjectionService implements ITeardownService {
  private readonly db = admin.firestore()
  private readonly outboxCollection = this.db.collection('outbox')
  private readonly vocabularyCollection = this.db.collection('vocabulary_definitions')
  private readonly projectionErrorsCollection = this.db.collection('projection_errors')
  
  private unsubscribe?: () => void
  private isProcessing = false
  private isStarted = false
  private isTornDown = false
  private pollingTimeoutIds: (NodeJS.Timeout | number)[] = []

  constructor(private readonly config: VocabularyProjectionConfig = DEFAULT_CONFIG) {}

  /**
   * Start the vocabulary projection service
   */
  start(): void {
    if (this.isStarted) {
      console.log('⚠️ [VOCAB_PROJECTION] Already started, skipping...')
      return
    }

    if (this.isTornDown) {
      throw new Error('Cannot start VocabularyProjectionService after teardown')
    }

    console.log('🚀 [VOCAB_PROJECTION] Starting vocabulary projection service')
    this.isStarted = true

    // Set up real-time listener for pending vocabulary events
    this.setupListener()
    
    // Start fallback polling
    this.startPolling()
  }

  /**
   * Set up Firestore listener for pending vocabulary events
   */
  private setupListener(): void {
    const unsubscribe = this.outboxCollection
      .where('status', '==', 'PENDING')
      .onSnapshot(
        (snapshot) => {
          if (snapshot.empty || this.isProcessing) return

          // Filter for vocabulary events only (handle both vocabulary/ and vocabulary. formats)
          const vocabularyEvents = snapshot.docs
            .map((doc: any) => ({ id: doc.id, ...doc.data() } as OutboxDocument))
            .filter((event: OutboxDocument) => 
              event.topic.startsWith('vocabulary/') || event.topic.startsWith('vocabulary.')
            )

          if (vocabularyEvents.length === 0) return

          console.log(`📦 [VOCAB_PROJECTION] Found ${vocabularyEvents.length} vocabulary events`)
          this.processBatch(vocabularyEvents)
        },
        (error: any) => {
          console.error('❌ [VOCAB_PROJECTION] Listener error:', error)
        }
      )

    this.unsubscribe = unsubscribe
  }

  /**
   * Stop the vocabulary projection service
   */
  stop(): void {
    console.log('🛑 [VOCAB_PROJECTION] Stopping vocabulary projection service')
    
    this.isStarted = false
    
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }

    // Clear polling timeouts
    for (const timeoutId of this.pollingTimeoutIds) {
      clearTimeout(timeoutId as number)
    }
    this.pollingTimeoutIds = []
  }

  /**
   * Teardown the service (implements ITeardownService)
   */
  teardown(): void {
    console.log('🧹 [VOCAB_PROJECTION] Tearing down vocabulary projection service')
    this.stop()
    this.isTornDown = true
    console.log('✅ [VOCAB_PROJECTION] Teardown complete')
  }

  /**
   * Check if the service is active
   */
  isActive(): boolean {
    return !this.isTornDown && this.isStarted
  }

  /**
   * Start fallback polling for vocabulary events
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isActive() || this.isProcessing) return

      try {
        const snapshot = await this.outboxCollection
          .where('status', '==', 'PENDING')
          .get()

        const vocabularyEvents = snapshot.docs
          .map((doc: any) => ({ id: doc.id, ...doc.data() } as OutboxDocument))
          .filter((event: OutboxDocument) => 
            event.topic.startsWith('vocabulary/') || event.topic.startsWith('vocabulary.')
          )

        if (vocabularyEvents.length > 0) {
          console.log(`📦 [VOCAB_PROJECTION] Poll found ${vocabularyEvents.length} vocabulary events`)
          await this.processBatch(vocabularyEvents)
        }
      } catch (error: any) {
        console.error('❌ [VOCAB_PROJECTION] Poll error:', error)
      }

      // Schedule next poll
      if (this.isActive()) {
        const timeoutId = setTimeout(poll, this.config.pollingIntervalMs)
        this.pollingTimeoutIds.push(timeoutId)
      }
    }

    const timeoutId = setTimeout(poll, this.config.pollingIntervalMs)
    this.pollingTimeoutIds.push(timeoutId)
  }

  /**
   * Process a batch of vocabulary events
   */
  private async processBatch(events: OutboxDocument[]): Promise<void> {
    if (events.length === 0 || this.isProcessing) return

    this.isProcessing = true
    const batch = this.db.batch()

    console.log(`🔄 [VOCAB_PROJECTION] Processing batch of ${events.length} vocabulary events`)

    try {
      // Process each event
      for (const event of events) {
        await this.processEvent(event, batch)
      }

      // Commit all updates atomically
      await batch.commit()
      
      console.log(`✅ [VOCAB_PROJECTION] Batch processed successfully`)

    } catch (error: any) {
      console.error('❌ [VOCAB_PROJECTION] Batch processing failed:', error)
      // Process remaining events individually with dead letter pattern
      for (const event of events) {
        await this.processEventWithErrorHandling(event)
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single vocabulary event
   */
  private async processEvent(event: OutboxDocument, batch: admin.firestore.WriteBatch): Promise<void> {
    const now = Date.now()
    const eventRef = this.outboxCollection.doc(event.id)

    try {
      // Mark as processing
      batch.update(eventRef, {
        status: 'PROCESSING',
        lastAttemptAt: now,
        attempts: event.attempts + 1
      })

      // Extract vocabulary event from payload
      const vocabularyEvent = event.payload as VocabularyEvent

      // Normalize topic format (vocabulary. -> vocabulary/)
      const normalizedType = event.topic.replace('vocabulary.', 'vocabulary/')
      
      // Handle different vocabulary event types based on normalized topic
      switch (normalizedType) {
        case 'vocabulary/wordDefinitionAdded':
          await this.handleWordDefinitionAdded(vocabularyEvent as WordDefinitionAdded, batch)
          break

        case 'vocabulary/wordDefinitionRemoved':
          await this.handleWordDefinitionRemoved(vocabularyEvent as WordDefinitionRemoved, batch)
          break

        default:
          console.log(`ℹ️ [VOCAB_PROJECTION] Skipping unhandled event type: ${normalizedType}`)
          break
      }

      // Mark as processed
      batch.update(eventRef, {
        status: 'PROCESSED',
        processedAt: now,
        error: null
      })

    } catch (error: any) {
      console.error(`❌ [VOCAB_PROJECTION] Failed to process event ${event.id}:`, error)
      
      // Mark as failed if max retries exceeded
      if (event.attempts >= this.config.maxRetries) {
        batch.update(eventRef, {
          status: 'FAILED',
          error: error.message || String(error)
        })
        await this.logProjectionError(event, error)
      }
    }
  }

  /**
   * Process event with individual error handling (dead letter pattern)
   */
  private async processEventWithErrorHandling(event: OutboxDocument): Promise<void> {
    try {
      await this.db.runTransaction(async (transaction) => {
        const eventRef = this.outboxCollection.doc(event.id)
        const eventDoc = await transaction.get(eventRef)

        if (!eventDoc.exists) {
          console.warn(`⚠️ [VOCAB_PROJECTION] Event ${event.id} no longer exists`)
          return
        }

        const eventData = eventDoc.data() as OutboxDocument

        // Skip if already processed
        if (eventData.status === 'PROCESSED') {
          return
        }

        const vocabularyEvent = event.payload as VocabularyEvent
        const now = Date.now()

        // Normalize topic format (vocabulary. -> vocabulary/)
        const normalizedType = event.topic.replace('vocabulary.', 'vocabulary/')
        
        // Handle event types based on normalized topic
        switch (normalizedType) {
          case 'vocabulary/wordDefinitionAdded':
            await this.handleWordDefinitionAddedTransaction(vocabularyEvent as WordDefinitionAdded, transaction)
            break

          case 'vocabulary/wordDefinitionRemoved':
            await this.handleWordDefinitionRemovedTransaction(vocabularyEvent as WordDefinitionRemoved, transaction)
            break

          default:
            console.log(`ℹ️ [VOCAB_PROJECTION] Skipping unhandled event type: ${normalizedType}`)
            break
        }

        // Update event status
        transaction.update(eventRef, {
          status: 'PROCESSED',
          processedAt: now,
          attempts: eventData.attempts + 1,
          error: null
        })
      })

    } catch (error: any) {
      console.error(`❌ [VOCAB_PROJECTION] Transaction failed for event ${event.id}:`, error)
      await this.logProjectionError(event, error)
      
      // Mark as failed in outbox
      const eventRef = this.outboxCollection.doc(event.id)
      await this.db.runTransaction(async (transaction) => {
        transaction.update(eventRef, {
          status: 'FAILED',
          error: error.message || String(error),
          lastAttemptAt: Date.now()
        })
      })
    }
  }

  /**
   * Handle WordDefinitionAdded event (batch mode)
   */
  private async handleWordDefinitionAdded(
    event: WordDefinitionAdded,
    batch: admin.firestore.WriteBatch
  ): Promise<void> {
    const { wordId, entry, tenant_id, aggregate_id } = event
    const docRef = this.vocabularyCollection.doc(wordId)

    const document: VocabularyDefinitionDocument = {
      wordId,
      entry,
      tenant_id,
      aggregate_id,
      createdAt: event.addedAt,
      updatedAt: event.addedAt,
      projectedAt: Date.now()
    }

    // Use set for idempotency (overwrites if exists)
    batch.set(docRef, document, { merge: true })

    console.log(`✅ [VOCAB_PROJECTION] Projected word definition: ${wordId}`)
  }

  /**
   * Handle WordDefinitionRemoved event (batch mode)
   */
  private async handleWordDefinitionRemoved(
    event: WordDefinitionRemoved,
    batch: admin.firestore.WriteBatch
  ): Promise<void> {
    const { wordId } = event
    const docRef = this.vocabularyCollection.doc(wordId)

    // Delete the document
    batch.delete(docRef)

    console.log(`🗑️ [VOCAB_PROJECTION] Removed word definition: ${wordId}`)
  }

  /**
   * Handle WordDefinitionAdded event (transaction mode)
   */
  private async handleWordDefinitionAddedTransaction(
    event: WordDefinitionAdded,
    transaction: admin.firestore.Transaction
  ): Promise<void> {
    const { wordId, entry, tenant_id, aggregate_id } = event
    const docRef = this.vocabularyCollection.doc(wordId)

    const document: VocabularyDefinitionDocument = {
      wordId,
      entry,
      tenant_id,
      aggregate_id,
      createdAt: event.addedAt,
      updatedAt: event.addedAt,
      projectedAt: Date.now()
    }

    // Use set for idempotency
    transaction.set(docRef, document, { merge: true })

    console.log(`✅ [VOCAB_PROJECTION] Projected word definition (transaction): ${wordId}`)
  }

  /**
   * Handle WordDefinitionRemoved event (transaction mode)
   */
  private async handleWordDefinitionRemovedTransaction(
    event: WordDefinitionRemoved,
    transaction: admin.firestore.Transaction
  ): Promise<void> {
    const { wordId } = event
    const docRef = this.vocabularyCollection.doc(wordId)

    // Delete the document
    transaction.delete(docRef)

    console.log(`🗑️ [VOCAB_PROJECTION] Removed word definition (transaction): ${wordId}`)
  }

  /**
   * Log projection error to projection_errors collection (dead letter pattern)
   */
  private async logProjectionError(event: OutboxDocument, error: unknown): Promise<void> {
    try {
      const errorId = `projection_error_${event.id}_${Date.now()}`
      const errorRef = this.projectionErrorsCollection.doc(errorId)

      const vocabularyEvent = event.payload as VocabularyEvent
      const tenant_id = (vocabularyEvent as any).tenant_id
      const aggregate_id = (vocabularyEvent as any).aggregate_id

      const errorDocument: ProjectionError = {
        id: errorId,
        eventId: event.id,
        topic: event.topic,
        error: error instanceof Error ? error.message : String(error),
        payload: event.payload,
        timestamp: Date.now(),
        tenant_id,
        aggregate_id
      }

      await errorRef.set(errorDocument)

      console.log(`📝 [VOCAB_PROJECTION] Logged projection error: ${errorId}`)

    } catch (logError: any) {
      console.error('❌ [VOCAB_PROJECTION] Failed to log projection error:', logError)
    }
  }

  /**
   * Manual trigger to process existing pending vocabulary events
   * Useful for backfilling or testing
   */
  async processExistingEvents(): Promise<void> {
    console.log('🔄 [VOCAB_PROJECTION] Processing existing vocabulary events')

    try {
      const snapshot = await this.outboxCollection
        .where('status', '==', 'PENDING')
        .get()

      const vocabularyEvents = snapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as OutboxDocument))
        .filter((event: OutboxDocument) => 
          event.topic.startsWith('vocabulary/') || event.topic.startsWith('vocabulary.')
        )

      console.log(`📦 [VOCAB_PROJECTION] Found ${vocabularyEvents.length} existing vocabulary events`)

      if (vocabularyEvents.length > 0) {
        await this.processBatch(vocabularyEvents)
      }

      console.log('✅ [VOCAB_PROJECTION] Existing events processing complete')

    } catch (error: any) {
      console.error('❌ [VOCAB_PROJECTION] Failed to process existing events:', error)
      throw error
    }
  }
}
