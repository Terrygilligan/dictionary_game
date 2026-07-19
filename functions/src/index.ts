/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Resend} from "resend";
import {defineSecret} from "firebase-functions/params";
import {getEmailContent} from "./templates/emailTemplates";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
admin.initializeApp();

// Define the Resend API key secret
const resendApiKey = defineSecret('RESEND_API_KEY');

/**
 * Cloud Function to process email queue documents
 * Triggered when a new document is created in the email_queue collection
 */
export const processEmailQueue = onDocumentCreated(
  {
    document: 'email_queue/{docId}',
    secrets: [resendApiKey],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.error('No snapshot provided');
      return;
    }

    const data = snapshot.data();
    const docId = event.params.docId;

    logger.info(`Processing email queue document: ${docId}`, { data });

    try {
      // Extract email data
      const { email, userId, template, data: templateData } = data;

      if (!email || !userId || !template) {
        throw new Error('Missing required fields: email, userId, or template');
      }

      // Get email content from template mapper
      const emailContent = getEmailContent(template, {
        email,
        userId,
        ...templateData,
      });

      // Initialize Resend with API key from secret
      const resend = new Resend(resendApiKey.value());

      // Send email
      const result = await resend.emails.send({
        from: 'Lexicon Master <onboarding@resend.dev>',
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
      });

      logger.info(`Email sent successfully via Resend`, {
        docId,
        email,
        template,
        resendId: result.data?.id,
      });

      // Delete the document after successful send to keep queue empty
      const firestore = admin.firestore();
      await firestore.collection('email_queue').doc(docId).delete();

      logger.info(`Email queue document deleted after successful send: ${docId}`);

    } catch (error) {
      logger.error(`Failed to process email queue document: ${docId}`, error);

      // Log error and leave document in queue for debugging/retry
      // Optionally move to email_errors collection for better tracking
      try {
        const firestore = admin.firestore();
        const errorDoc = {
          ...data,
          originalDocId: docId,
          error: error instanceof Error ? error.message : 'Unknown error',
          errorAt: admin.firestore.FieldValue.serverTimestamp(),
          retryCount: 0,
        };

        // Move to email_errors collection for tracking
        await firestore.collection('email_errors').add(errorDoc);

        // Delete from queue after moving to errors
        await firestore.collection('email_queue').doc(docId).delete();

        logger.info(`Email queue document moved to email_errors collection: ${docId}`);
      } catch (moveError) {
        logger.error(`Failed to move document to email_errors: ${docId}`, moveError);
        // Document remains in email_queue for manual inspection
      }
    }
  }
);
