# MIGRATION ROADMAP: BACKEND-FIRST TRANSITION

## Phase 1: Foundation & Queue Setup ✅ COMPLETED

- [x] Define the schema for the new email_queue collection.
- [x] Update firestore.rules to allow write access to email_queue for authenticated users but explicitly block read/delete.
- [x] Refactor the client-side AuthService to push events to email_queue instead of the old outbox.

## Phase 2: The Backend Engine ✅ COMPLETED

- [x] Initialize/Configure functions/src/index.ts to use the Firebase Admin SDK.
- [x] Create the processEmailQueue Cloud Function (triggered by onDocumentCreated('email_queue/{id}')).
- [x] Implement logic: Read event → Send Email/Process Side-effect → Delete document from email_queue.
- [x] Create template mapper system for centralized email content management.
- [x] Integrate Resend API for email delivery.
- [x] Configure secret manager for RESEND_API_KEY.

## Phase 3: Verification & Cleanup ✅ COMPLETED

- [x] Verify the full flow (Registration → Queue write → Backend function trigger → Email sent).
- [x] Delete the OutboxProcessor and all associated browser-side circuit breakers.
- [x] Delete EmailVerificationService and EmailVerificationPage.
- [x] Rename OutboxProvider to UserProjectionProvider.
- [x] Sanitize firestore.rules to remove all legacy outbox rules.
- [x] Deploy Cloud Functions to production (us-central1, Node.js 20).

## Status: ✅ ALL PHASES COMPLETED

**Completion Date**: 2026-07-19
**Deployment Status**: Production
**Cloud Function**: `processEmailQueue` active
**Email Provider**: Resend API

## How to use this roadmap effectively

Whenever you start a new chat, just paste this:

> "I am following the MIGRATION ROADMAP defined in my documentation. We are currently at [Phase X, Task Y]. Please assist me in completing this step while adhering to the Backend-Offloading directive in ARCHITECTURAL_MANIFESTO.md."

## Getting Started (Phase 1, Task 1)

Since we want to start moving to the backend now, let's define the email_queue schema. To keep it simple and compliant, it should hold just enough information to identify the user and the event, without storing unnecessary PII (Personally Identifiable Information) in the queue itself.

### Proposed email_queue Schema

- `userId` (string)
- `email` (string)
- `template` (string) - e.g., 'welcome_registration'
- `status` (string) - 'pending' (The Cloud Function will pick it up when it sees this)
- `createdAt` (timestamp)
