import { Resend } from 'resend';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { getEmailContent, type TemplateData } from '../templates/emailTemplates';

// Define the Resend API key secret
const resendApiKey = defineSecret('RESEND_API_KEY');

/**
 * Sent Email Record Schema
 * Tracks emails that have been sent to prevent duplicates
 */
interface SentEmailRecord {
  readonly correlationId: string;
  readonly templateType: string;
  readonly sentAt: number;
  readonly recipientEmail: string;
}

/**
 * Email Template Service
 * 
 * Centralized service for email operations using Resend API.
 * Provides template mapping, idempotency checks, and unified email delivery.
 * 
 * Key Features:
 * - Template Type Mapping: Maps event types to Resend template IDs
 * - Idempotency: Prevents duplicate sends via sent_emails collection
 * - Type Safety: Uses TemplateData interfaces for type-safe template data
 * - Error Handling: Centralized error handling and logging
 * - Atomic Operations: Uses Firestore transactions for idempotency checks
 */
export class EmailTemplateService {
  private readonly db = admin.firestore();
  private readonly sentEmailsCollection = 'sent_emails';
  private resend?: Resend;

  /**
   * Initialize Resend client with API key
   * Called lazily to avoid initialization during function cold start
   */
  private getResendClient(): Resend {
    if (!this.resend) {
      this.resend = new Resend(resendApiKey.value());
    }
    return this.resend;
  }

  /**
   * Send email using Resend API with idempotency check
   * 
   * @param templateType - The template type (e.g., 'welcome_registration', 'email_verification', 'password_reset')
   * @param data - Template data for interpolation
   * @param correlationId - Unique correlation ID for idempotency
   * @returns Promise that resolves when email is sent or skipped if already sent
   */
  async sendEmail(
    templateType: string,
    data: TemplateData,
    correlationId: string
  ): Promise<void> {
    console.log(`EmailTemplateService.sendEmail called`, {
      templateType,
      correlationId,
      recipientEmail: (data as any).email,
    });

    try {
      // Idempotency Check: Verify email hasn't already been sent for this correlationId
      const alreadySent = await this.checkAlreadySent(correlationId);
      if (alreadySent) {
        console.log(`Email already sent for correlationId, skipping`, correlationId);
        return;
      }

      // Get email content from template mapper
      const emailContent = getEmailContent(templateType, data);
      const recipientEmail = (data as any).email;

      if (!recipientEmail) {
        throw new Error('Recipient email is required in template data');
      }

      // Send email via Resend
      const resend = this.getResendClient();
      const result = await resend.emails.send({
        from: 'Lexicon Master <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log(`Email sent successfully via Resend`, {
        templateType,
        correlationId,
        recipientEmail,
        resendId: result.data?.id,
      });

      // Mark as sent in Firestore for idempotency
      await this.markAsSent(correlationId, templateType, recipientEmail);

    } catch (error) {
      console.error(`Failed to send email via EmailTemplateService`, {
        templateType,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if email has already been sent for this correlationId
   * 
   * @param correlationId - Unique correlation ID to check
   * @returns Promise<boolean> - True if email was already sent
   */
  async checkAlreadySent(correlationId: string): Promise<boolean> {
    try {
      const sentEmailRef = this.db.collection(this.sentEmailsCollection).doc(correlationId);
      const snapshot = await sentEmailRef.get();
      
      return snapshot.exists();
    } catch (error) {
      console.error(`Failed to check sent email status`, {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Fail open - if check fails, allow send to proceed
      return false;
    }
  }

  /**
   * Mark email as sent in Firestore for idempotency
   * Uses transaction to ensure atomic check-and-set
   * 
   * @param correlationId - Unique correlation ID
   * @param templateType - Template type that was sent
   * @param recipientEmail - Recipient email address
   */
  async markAsSent(
    correlationId: string,
    templateType: string,
    recipientEmail: string
  ): Promise<void> {
    try {
      await this.db.runTransaction(async (transaction) => {
        const sentEmailRef = this.db.collection(this.sentEmailsCollection).doc(correlationId);
        
        // Double-check that record doesn't exist (race condition prevention)
        const snapshot = await transaction.get(sentEmailRef);
        if (snapshot.exists()) {
          console.log(`Sent email record already exists in transaction, skipping`, correlationId);
          return;
        }

        // Create sent email record
        const sentEmailRecord: SentEmailRecord = {
          correlationId,
          templateType,
          sentAt: Date.now(),
          recipientEmail,
        };

        transaction.set(sentEmailRef, sentEmailRecord);
      });

      console.log(`Email marked as sent`, {
        correlationId,
        templateType,
        recipientEmail,
      });
    } catch (error) {
      console.error(`Failed to mark email as sent`, {
        correlationId,
        templateType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Non-critical error - email was sent successfully even if marking fails
    }
  }

  /**
   * Get Resend template ID for a given template type
   * Currently using inline templates, but can be extended to use Resend template IDs
   * 
   * @param templateType - The template type
   * @returns Resend template ID or null if using inline templates
   */
  getTemplateId(templateType: string): string | null {
    // Currently using inline templates via emailTemplates.ts
    // Can be extended to return Resend template IDs when using Resend's template system
    const templateIds: Record<string, string> = {
      // Future: Map to actual Resend template IDs
      // 'welcome_registration': 'resend-template-id-123',
      // 'email_verification': 'resend-template-id-456',
      // 'password_reset': 'resend-template-id-789',
    };
    
    return templateIds[templateType] || null;
  }
}

/**
 * Export singleton instance for application use
 */
export const emailTemplateService = new EmailTemplateService();
