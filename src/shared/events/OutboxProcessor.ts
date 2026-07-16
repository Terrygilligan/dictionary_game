import type { IEventPublisher } from './EventPublisher'
import { getFirestoreDB } from '@/shared/api/firebase'
import { consoleEventPublisher } from './ConsoleEventPublisher'
import { userEventBus, createUserEventEnvelope } from './UserEventBus'
import type { UserRegisteredEvent } from './EventPublisher'
import { doc, collection, query, where, onSnapshot, writeBatch, getDocs, WriteBatch } from 'firebase/firestore'
import type { ITeardownService } from '../services/ITeardownService.ts'
import { SecurityContextError } from '../services/ITeardownService.ts'

/**
 * Outbox Document Schema
 */
export interface OutboxDocument {
  readonly id: string                    // correlation_id (unique)
  readonly topic: string                  // event topic (e.g., 'user.registered')
  readonly payload: unknown               // event payload
  readonly correlationId: string          // correlation ID from command
  readonly status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  readonly createdAt: number              // timestamp when created
  readonly attempts: number               // number of processing attempts
  readonly lastAttemptAt?: number         // timestamp of last attempt
  readonly error?: string                 // last error message
  readonly processedAt?: number            // timestamp when successfully processed
  readonly nextRetryAt?: number           // timestamp for next retry attempt
}

/**
 * Outbox Processor Configuration
 */
export interface OutboxProcessorConfig {
  readonly maxRetries: number             // Maximum retry attempts
  readonly retryDelayMs: number          // Base delay between retries
  readonly retryBackoffMultiplier: number // Exponential backoff multiplier
  readonly maxRetryDelayMs: number       // Maximum retry delay
  readonly batchSize: number              // Number of events to process per batch
  readonly pollingIntervalMs: number     // Polling interval for fallback
}

/**
 * Outbox Processor
 * 
 * Processes events from the outbox collection using the transactional outbox pattern.
 * Ensures exactly-once delivery with retry logic and error handling.
 * 
 * Enhanced with authentication-aware error handling to prevent permission errors
 * from spamming the console for unauthenticated users.
 * 
 * Now implements ITeardownService for graceful cleanup during logout.
 */
export class OutboxProcessor implements ITeardownService {
  private readonly db = getFirestoreDB()
  private readonly outboxCollection = collection(this.db, 'outbox')
  private unsubscribe?: () => void
  private isProcessing = false
  private isStarted = false
  private permissionErrorCount = 0
  private readonly maxPermissionErrors = 3 // Stop after 3 permission errors
  private isTornDown = false // Constraint #1: Idempotency flag
  private pollingTimeoutIds: (NodeJS.Timeout | number)[] = [] // Track all setTimeout IDs for cleanup

  constructor(
    private readonly publisher: IEventPublisher,
    private readonly config: OutboxProcessorConfig = {
      maxRetries: 5,
      retryDelayMs: 1000,
      retryBackoffMultiplier: 2,
      maxRetryDelayMs: 300000, // 5 minutes
      batchSize: 10,
      pollingIntervalMs: 5000, // 5 seconds
    }
  ) {}

  /**
   * Start the outbox processor
   * Uses Firestore real-time listener for immediate processing
   * Enhanced with permission error handling for unauthenticated users
   */
  start(): void {
    if (this.isStarted) {
      console.log('⚠️ [SERVICE_GATE] OutboxProcessor already started, skipping...')
      return
    }

    if (this.isTornDown) {
      throw new SecurityContextError(
        'Cannot start OutboxProcessor after teardown',
        undefined,
        undefined,
        'OutboxProcessor.start'
      )
    }

    console.log('🚀 [SERVICE_GATE] Starting OutboxProcessor (auth should be ready via UserProvider guard)')
    this.isStarted = true
    this.permissionErrorCount = 0

    // Query for pending events
    const pendingQuery = query(
      this.outboxCollection,
      where('status', '==', 'PENDING')
    )

    // Set up real-time listener
    this.unsubscribe = onSnapshot(pendingQuery, 
      (snapshot) => {
        if (snapshot.empty || this.isProcessing) return
        
        console.log(`📦 [OUTBOX_PROCESSOR] Found ${snapshot.docs.length} pending events`)
        
        // Process events in batches
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as OutboxDocument))

        this.processBatch(events)
      },
      (error) => {
        this.handleError(error)
      }
    )

    // Start fallback polling as backup
    this.startPolling()
  }

  /**
   * Stop the outbox processor
   */
  stop(): void {
    console.log('🛑 [SERVICE_GATE] Stopping OutboxProcessor...')
    
    this.isStarted = false
    this.permissionErrorCount = 0
    
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  /**
   * Teardown the outbox processor - Constraint #1: Strict Teardown Contract
   * Performs absolute state reset with idempotency protection.
   */
  teardown(tenant_id?: string): void {
    console.log(`🧹 [SERVICE_TEARDOWN] OutboxProcessor teardown starting for tenant: ${tenant_id || 'all'}`)
    
    // Constraint #1: Idempotency check
    if (this.isTornDown) {
      console.log('ℹ️ [SERVICE_TEARDOWN] OutboxProcessor already torn down, skipping')
      return
    }

    console.log('🧹 [SERVICE_TEARDOWN] OutboxProcessor status before: Active')
    
    // Constraint #3: Internal Buffer Flushing - Stop normal operations
    this.stop()
    
    // Constraint #3: Clear all tracked setTimeout timers
    console.log(`🧹 [SERVICE_TEARDOWN] Clearing ${this.pollingTimeoutIds.length} polling timers`)
    for (const timeoutId of this.pollingTimeoutIds) {
      clearTimeout(timeoutId as number)
    }
    this.pollingTimeoutIds = []
    
    // Constraint #1: Mark as torn down (idempotency)
    this.isTornDown = true
    
    console.log('🧹 [SERVICE_TEARDOWN] OutboxProcessor status after: Inactive')
    console.log('✅ [SERVICE_TEARDOWN] OutboxProcessor teardown complete')
  }

  /**
   * Check if the outbox processor is active
   */
  isActive(): boolean {
    return !this.isTornDown && this.isStarted
  }

  /**
   * Handle errors with special logic for permission errors
   */
  private handleError(error: any): void {
    const errorMessage = error?.message || String(error)
    
    // Check for permission-related errors
    if (errorMessage.includes('Missing or insufficient permissions') || 
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('PERMISSION_DENIED')) {
      
      this.permissionErrorCount++
      
      if (this.permissionErrorCount <= this.maxPermissionErrors) {
        console.warn(`🔒 [OUTBOX_PROCESSOR] Permission error ${this.permissionErrorCount}/${this.maxPermissionErrors}: User likely not authenticated`)
      } else {
        console.error('🚫 [OUTBOX_PROCESSOR] Too many permission errors, stopping processor to prevent spam')
        this.stop()
        return
      }
      
      // For permission errors, don't retry immediately - wait much longer or stop
      if (this.permissionErrorCount >= 2) {
        // After 2 permission errors, stop completely - requires explicit restart
        this.stop()
        return
      }
      
      const timeoutId = setTimeout(() => this.startPolling(), this.config.pollingIntervalMs * 5)
      this.pollingTimeoutIds.push(timeoutId)
      return
    }
    
    // For other errors, use the original logic
    console.error('❌ [OUTBOX_PROCESSOR] Listener error:', error)
    const timeoutId = setTimeout(() => this.startPolling(), this.config.pollingIntervalMs)
    this.pollingTimeoutIds.push(timeoutId)
  }

  /**
   * Fallback polling mechanism
   * Enhanced with permission error handling
   */
  private startPolling(): void {
    const poll = async () => {
      if (this.isProcessing || !this.isStarted) return

      try {
        const pendingQuery = query(
          this.outboxCollection,
          where('status', '==', 'PENDING')
        )
        
        const snapshot = await getDocs(pendingQuery)
        
        if (!snapshot.empty) {
          const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as OutboxDocument))

          await this.processBatch(events)
        }
      } catch (error) {
        this.handleError(error)
        return // Don't schedule next poll if it's a permission error (handleError will manage)
      }

      // Schedule next poll only if still started and minimal permission errors
      if (this.isStarted && this.permissionErrorCount < 2) {
        const timeoutId = setTimeout(poll, this.config.pollingIntervalMs)
        this.pollingTimeoutIds.push(timeoutId)
      }
    }

    poll()
  }

  /**
   * Process a batch of outbox events
   */
  private async processBatch(events: OutboxDocument[]): Promise<void> {
    if (events.length === 0) return

    this.isProcessing = true
    const batch = writeBatch(this.db)

    console.log(`🔄 [OUTBOX_PROCESSOR] Processing batch of ${events.length} events`)

    try {
      // Process each event
      for (const event of events) {
        await this.processEvent(event, batch)
      }

      // Commit all updates atomically
      await batch.commit()
      
      console.log(`✅ [OUTBOX_PROCESSOR] Batch processed successfully`)

    } catch (error) {
      console.error('❌ [OUTBOX_PROCESSOR] Batch processing failed:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a single outbox event
   */
  private async processEvent(event: OutboxDocument, batch: WriteBatch): Promise<void> {
    const now = Date.now()
    const eventRef = doc(this.outboxCollection, event.id)

    try {
      // Mark as processing to prevent duplicate processing
      batch.update(eventRef, {
        status: 'PROCESSING',
        lastAttemptAt: now,
        attempts: event.attempts + 1
      })

      // Handle specific event types
      if (event.topic === 'user.registered') {
        // Publish to UserEventBus for multiple subscribers
        // EmailVerificationService and UserProjectionService will handle this
        const userEvent = event.payload as UserRegisteredEvent
        
        // Extract tenant_id and aggregate_id from payload
        // These MUST have been set during command dispatch for multi-tenant isolation
        const tenant_id = (userEvent.payload as any).tenant_id
        const aggregate_id = (userEvent.payload as any).aggregate_id
        
        // Strict validation: Fail fast if identity metadata is missing
        if (!tenant_id || !aggregate_id) {
          throw new Error(
            `Multi-tenant identity metadata missing from user.registered event payload. ` +
            `Required: tenant_id and aggregate_id. ` +
            `CorrelationId: ${event.correlationId}. ` +
            `This violates the multi-tenant enforcement directive.`
          )
        }
        
        const envelope = createUserEventEnvelope(
          tenant_id,
          aggregate_id,
          event.correlationId,
          userEvent
        )
        
        userEventBus.publish(envelope)
        
        console.log(`📤 [OUTBOX_PROCESSOR] User event published to UserEventBus:`, {
          correlationId: event.correlationId,
          eventType: event.topic,
          tenant_id,
          aggregate_id,
        })
      } else {
        // Default event publishing for other events
        await this.publisher.publish(event.topic, event.payload)
      }

      // Mark as processed
      batch.update(eventRef, {
        status: 'PROCESSED',
        processedAt: now,
        error: null
      })

      console.log(`✅ [OUTBOX_PROCESSOR] Event processed: ${event.id} (${event.topic})`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Determine if we should retry
      if (event.attempts < this.config.maxRetries) {
        const nextRetryAt = this.calculateNextRetryAt(event.attempts)
        
        batch.update(eventRef, {
          status: 'PENDING',
          lastAttemptAt: now,
          attempts: event.attempts + 1,
          error: errorMessage,
          nextRetryAt
        })

        console.log(`🔄 [OUTBOX_PROCESSOR] Event scheduled for retry: ${event.id} (attempt ${event.attempts + 1})`)
      } else {
        // Max retries reached - mark as failed
        batch.update(eventRef, {
          status: 'FAILED',
          lastAttemptAt: now,
          attempts: event.attempts + 1,
          error: errorMessage
        })

        console.error(`💥 [OUTBOX_PROCESSOR] Event failed permanently: ${event.id} (${event.attempts + 1} attempts)`)
      }
    }
  }

  /**
   * Calculate next retry timestamp with exponential backoff
   */
  private calculateNextRetryAt(attempts: number): number {
    const delay = Math.min(
      this.config.retryDelayMs * Math.pow(this.config.retryBackoffMultiplier, attempts),
      this.config.maxRetryDelayMs
    )
    
    return Date.now() + delay
  }

  /**
   * Get outbox statistics for monitoring
   */
  async getStats(): Promise<{
    pending: number
    processing: number
    processed: number
    failed: number
  }> {
    const [pending, processing, processed, failed] = await Promise.all([
      this.getCountByStatus('PENDING'),
      this.getCountByStatus('PROCESSING'),
      this.getCountByStatus('PROCESSED'),
      this.getCountByStatus('FAILED')
    ])

    return { pending, processing, processed, failed }
  }

  /**
   * Helper method to count documents by status
   */
  private async getCountByStatus(status: string): Promise<number> {
    const querySnapshot = await getDocs(query(
      this.outboxCollection,
      where('status', '==', status)
    ))
    
    return querySnapshot.size
  }

  /**
   * Manually retry failed events (for admin/recovery purposes)
   */
  async retryFailedEvents(): Promise<void> {
    const failedQuery = query(
      this.outboxCollection,
      where('status', '==', 'FAILED')
    )

    const snapshot = await getDocs(failedQuery)
    const batch = writeBatch(this.db)

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'PENDING',
        attempts: 0,
        error: null,
        nextRetryAt: null
      })
    })

    await batch.commit()
    
    console.log(`🔄 [OUTBOX_PROCESSOR] Reset ${snapshot.size} failed events to PENDING`)
  }
}

/**
 * Export singleton instance for application use
 */
export const outboxProcessor = new OutboxProcessor(consoleEventPublisher)
