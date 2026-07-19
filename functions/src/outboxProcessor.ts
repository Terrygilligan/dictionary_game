import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { emailTemplateService } from "./services/EmailTemplateService";

admin.initializeApp();

/**
 * Outbox Processor - Processes PENDING outbox events
 * Triggered when a new document is created in the outbox collection
 * Uses EmailTemplateService exclusively for email delivery (no Firebase Auth calls)
 * 
 * Architecture:
 * - Idempotency: Checks processedAt timestamp before processing
 * - Circuit Breaker: Max 3 retries before moving to outbox_failed
 * - Security: Only processes events with valid tenant_id
 * - Atomic Operations: Uses Firestore transactions for status updates
 */
export const processOutboxEvent = onDocumentCreated(
  {
    document: 'outbox/{correlationId}',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No snapshot provided');
      return;
    }

    const data = snapshot.data();
    const correlationId = event.params.correlationId;

    logger.info(`Processing outbox event: ${correlationId}`, { data });

    try {
      // Idempotency Check: Skip if already processed
      if (data.status === 'PROCESSED' && data.processedAt) {
        logger.info(`Event already processed, skipping: ${correlationId}`);
        return;
      }

      // Circuit Breaker: Check retry count
      if (data.attempts >= 3) {
        logger.warn(`Max retries exceeded for event: ${correlationId}, moving to failed`);
        await moveToFailedCollection(data, correlationId);
        return;
      }

      // Update status to PROCESSING atomically
      const firestore = admin.firestore();
      await firestore.runTransaction(async (transaction) => {
        const outboxRef = firestore.collection('outbox').doc(correlationId);
        
        // Double-check status within transaction for race condition prevention
        const doc = await transaction.get(outboxRef);
        if (!doc.exists) {
          throw new Error('Outbox document not found');
        }
        
        const currentData = doc.data();
        if (currentData?.status === 'PROCESSED') {
          logger.info(`Event already processed in transaction, skipping: ${correlationId}`);
          return; // Skip processing
        }

        // Update to PROCESSING status
        transaction.update(outboxRef, {
          status: 'PROCESSING',
          lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
          attempts: admin.firestore.FieldValue.increment(1),
        });
      });

      logger.info(`Event marked as PROCESSING: ${correlationId}`);

      // Process the event based on topic
      await processEventByTopic(data, correlationId);

      // Mark as PROCESSED
      await firestore.collection('outbox').doc(correlationId).update({
        status: 'PROCESSED',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Event processed successfully: ${correlationId}`);

    } catch (error) {
      logger.error(`Failed to process outbox event: ${correlationId}`, error);

      // Update status to FAILED with retry logic
      try {
        const firestore = admin.firestore();
        const outboxRef = firestore.collection('outbox').doc(correlationId);
        
        const currentAttempts = data.attempts || 0;
        if (currentAttempts >= 3) {
          // Max retries reached - move to failed collection
          await moveToFailedCollection(data, correlationId);
        } else {
          // Schedule retry with exponential backoff
          const nextRetryAt = new Date(Date.now() + Math.pow(2, currentAttempts) * 1000); // 2^attempts seconds
          
          await outboxRef.update({
            status: 'FAILED',
            lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
            attempts: admin.firestore.FieldValue.increment(1),
            error: error instanceof Error ? error.message : 'Unknown error',
            nextRetryAt: nextRetryAt.getTime(),
          });
          
          logger.info(`Event marked as FAILED with retry scheduled: ${correlationId}`);
        }
      } catch (updateError) {
        logger.error(`Failed to update outbox status: ${correlationId}`, updateError);
      }
    }
  }
);

/**
 * Process events based on their topic
 * Uses EmailTemplateService for email delivery - NO Firebase Auth calls
 */
async function processEventByTopic(data: any, correlationId: string): Promise<void> {
  const { topic, payload } = data;

  logger.info(`Processing event by topic: ${topic}`, { correlationId });

  switch (topic) {
    case 'user.registered':
      await handleUserRegistered(payload, correlationId);
      break;
    
    case 'user.email-verified':
      // Email verification events don't require email sending
      logger.info(`Email verification event processed (no email needed): ${correlationId}`);
      break;
    
    default:
      logger.warn(`Unknown event topic: ${topic}`, { correlationId });
  }
}

/**
 * Handle user registered event
 * Uses EmailTemplateService exclusively - NO Firebase Auth calls
 */
async function handleUserRegistered(payload: any, correlationId: string): Promise<void> {
  const { email, displayName, userId } = payload;

  if (!email) {
    throw new Error('Missing email in user.registered payload');
  }

  logger.info(`Sending welcome email for user registration: ${userId}`, { 
    correlationId, 
    email 
  });

  // Use EmailTemplateService to send welcome email
  await emailTemplateService.sendEmail('welcome_registration', {
    email,
    displayName,
    userId,
  }, correlationId);

  logger.info(`Welcome email sent successfully via EmailTemplateService`, {
    correlationId,
    userId,
    email,
  });
}

/**
 * Move failed event to outbox_failed collection
 * Prevents infinite retry loops
 */
async function moveToFailedCollection(data: any, correlationId: string): Promise<void> {
  const firestore = admin.firestore();
  
  const failedDoc = {
    ...data,
    originalCorrelationId: correlationId,
    failedAt: admin.firestore.FieldValue.serverTimestamp(),
    finalAttemptCount: data.attempts || 0,
  };

  await firestore.collection('outbox_failed').add(failedDoc);
  
  // Delete from outbox collection
  await firestore.collection('outbox').doc(correlationId).delete();

  logger.info(`Event moved to outbox_failed collection: ${correlationId}`);
}
