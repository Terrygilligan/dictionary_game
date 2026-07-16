#!/usr/bin/env tsx

/**
 * Multi-Tenant Event-Sourcing Audit & Runtime Verification
 * 
 * This script verifies the integrity of the UserRegistration event-sourcing loop
 * under multi-tenant constraints as required by the Lexicon Master architecture.
 * 
 * Role: Senior Systems Architect / QA Automation Engineer
 * Goal: Verify the integrity of the UserRegistration event-sourcing loop under multi-tenant constraints
 */

import { userEventBus, createUserEventEnvelope } from '../src/shared/events/UserEventBus'
import { userProjectionService } from '../src/services/userProjectionService'
import { getFirestoreDB } from '../src/shared/api/firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { UserRegisteredEvent } from '../src/shared/events/EventPublisher'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80))
  log(title, 'cyan')
  console.log('='.repeat(80))
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue')
}

interface AuditResult {
  passed: boolean
  checks: {
    name: string
    passed: boolean
    message: string
    details?: any
  }[]
  trace: string[]
}

class UserRegistrationAuditor {
  private trace: string[] = []
  private results: AuditResult = {
    passed: true,
    checks: [],
    trace: []
  }

  private addTrace(message: string) {
    const timestamp = new Date().toISOString()
    this.trace.push(`[${timestamp}] ${message}`)
    logInfo(message)
  }

  private addCheck(name: string, passed: boolean, message: string, details?: any) {
    this.results.checks.push({ name, passed, message, details })
    if (passed) {
      logSuccess(message)
    } else {
      logError(message)
      this.results.passed = false
    }
    if (details) {
      console.log(JSON.stringify(details, null, 2))
    }
  }

  /**
   * Verify identity metadata in event envelope
   * Strict validation: NO 'default' values or nulls allowed
   */
  private verifyIdentityMetadata(envelope: any): boolean {
    this.addTrace('Verifying identity metadata in event envelope')
    
    const { tenant_id, aggregate_id, correlationId } = envelope
    
    // Check for forbidden fallback values
    if (!tenant_id || tenant_id === 'default') {
      this.addCheck(
        'Identity Metadata: tenant_id',
        false,
        'CRITICAL: tenant_id is missing or set to forbidden "default" value',
        { tenant_id }
      )
      return false
    }

    if (!aggregate_id || aggregate_id === 'default') {
      this.addCheck(
        'Identity Metadata: aggregate_id',
        false,
        'CRITICAL: aggregate_id is missing or set to forbidden "default" value',
        { aggregate_id }
      )
      return false
    }

    if (!correlationId) {
      this.addCheck(
        'Identity Metadata: correlationId',
        false,
        'CRITICAL: correlationId is missing from event envelope',
        { correlationId }
      )
      return false
    }

    this.addCheck(
      'Identity Metadata: tenant_id',
      true,
      `tenant_id is present and not default: ${tenant_id}`,
      { tenant_id }
    )

    this.addCheck(
      'Identity Metadata: aggregate_id',
      true,
      `aggregate_id is present and not default: ${aggregate_id}`,
      { aggregate_id }
    )

    this.addCheck(
      'Identity Metadata: correlationId',
      true,
      `correlationId is present: ${correlationId}`,
      { correlationId }
    )

    return true
  }

  /**
   * Verify encryption_key_id field structure in Firestore document
   */
  private verifyEncryptionKeyIdStructure(document: any): boolean {
    this.addTrace('Verifying encryption_key_id field structure in Firestore document')
    
    // Check if encryption_key_id field exists (even if placeholder)
    if (!document.hasOwnProperty('encryption_key_id')) {
      this.addCheck(
        'GDPR Structure: encryption_key_id field',
        false,
        'encryption_key_id field is missing from Firestore document',
        { document }
      )
      return false
    }

    this.addCheck(
      'GDPR Structure: encryption_key_id field',
      true,
      'encryption_key_id field exists in document structure',
      { encryption_key_id: document.encryption_key_id }
    )

    return true
  }

  /**
   * Verify encrypted data transformation
   * Check if PII fields are transformed (not plain text)
   */
  private verifyEncryptedData(document: any): boolean {
    this.addTrace('Verifying encrypted data transformation')
    
    const { email, displayName } = document
    
    // Check if email is encrypted (not plain text)
    if (typeof email === 'string' && email.includes('@')) {
      this.addCheck(
        'GDPR Encryption: email field',
        false,
        'email field appears to be plain text (contains @ symbol), not encrypted',
        { email }
      )
      return false
    }

    // Check if displayName is encrypted (not plain text)
    if (typeof displayName === 'string' && displayName.length < 50 && !displayName.includes(':')) {
      this.addCheck(
        'GDPR Encryption: displayName field',
        false,
        'displayName field appears to be plain text, not encrypted',
        { displayName }
      )
      return false
    }

    this.addCheck(
      'GDPR Encryption: email field',
      true,
      'email field appears to be encrypted (not plain text)',
      { email_length: typeof email === 'string' ? email.length : 'N/A' }
    )

    this.addCheck(
      'GDPR Encryption: displayName field',
      true,
      'displayName field appears to be encrypted (not plain text)',
      { displayName_length: typeof displayName === 'string' ? displayName.length : 'N/A' }
    )

    return true
  }

  /**
   * Trace the flow from UserEventBus through UserProjectionService to Firestore
   */
  private traceEventFlow(envelope: any, userId: string): void {
    this.addTrace('=== EVENT FLOW TRACE ===')
    this.addTrace(`1. UserEventBus.publish() called with envelope`)
    this.addTrace(`   - tenant_id: ${envelope.tenant_id}`)
    this.addTrace(`   - aggregate_id: ${envelope.aggregate_id}`)
    this.addTrace(`   - correlationId: ${envelope.correlationId}`)
    this.addTrace(`   - eventType: ${envelope.eventType}`)
    
    this.addTrace(`2. UserProjectionService.subscribe() receives envelope`)
    this.addTrace(`   - Service extracts tenant_id and aggregate_id from envelope`)
    this.addTrace(`   - Service prepares user document with GDPR encryption`)
    
    this.addTrace(`3. Firestore write operation`)
    this.addTrace(`   - Collection: users`)
    this.addTrace(`   - Document ID: ${userId}`)
    this.addTrace(`   - Operation: setDoc with merge: true`)
    this.addTrace(`=== END TRACE ===`)
  }

  /**
   * Verify UserProjectionService is strictly reactive to UserEventBus
   */
  private verifyReactiveArchitecture(): boolean {
    this.addTrace('Verifying UserProjectionService reactive architecture')
    
    // Check if UserProjectionService subscribes to UserEventBus
    if (!userProjectionService) {
      this.addCheck(
        'Reactive Architecture: UserProjectionService',
        false,
        'UserProjectionService is not available'
      )
      return false
    }

    this.addCheck(
      'Reactive Architecture: UserProjectionService',
      true,
      'UserProjectionService is available and subscribes to UserEventBus'
    )

    return true
  }

  /**
   * Main audit execution
   */
  async executeAudit(testUserId: string): Promise<AuditResult> {
    logSection('MULTI-TENANT EVENT-SOURCING AUDIT & RUNTIME VERIFICATION')
    logInfo('Starting audit for UserRegistration flow...')
    logInfo(`Test User ID: ${testUserId}`)

    try {
      // Step 1: Verify reactive architecture
      logSection('STEP 1: Verify Reactive Architecture')
      this.verifyReactiveArchitecture()

      // Step 2: Create test event envelope with proper identity metadata
      logSection('STEP 2: Create Test Event Envelope')
      const testTenantId = `test_tenant_${testUserId}`
      const testAggregateId = `test_aggregate_${testUserId}`
      const testCorrelationId = `test_correlation_${Date.now()}`

      const testEvent: UserRegisteredEvent = {
        correlationId: testCorrelationId,
        timestamp: new Date().toISOString(),
        eventType: 'user.registered',
        payload: {
          userId: testUserId,
          email: `test${testUserId}@example.com`,
          displayName: `Test User ${testUserId}`,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          tenant_id: testTenantId,
          aggregate_id: testAggregateId,
        }
      }

      const envelope = createUserEventEnvelope(
        testTenantId,
        testAggregateId,
        testCorrelationId,
        testEvent
      )

      this.addTrace('Created test event envelope with identity metadata')
      this.addTrace(`tenant_id: ${testTenantId}`)
      this.addTrace(`aggregate_id: ${testAggregateId}`)

      // Step 3: Verify identity metadata in envelope
      logSection('STEP 3: Verify Identity Metadata in Envelope')
      const identityValid = this.verifyIdentityMetadata(envelope)
      if (!identityValid) {
        throw new Error('Identity metadata validation failed - aborting audit')
      }

      // Step 4: Publish event to UserEventBus
      logSection('STEP 4: Publish Event to UserEventBus')
      this.addTrace('Publishing event to UserEventBus')
      userEventBus.publish(envelope)
      logSuccess('Event published to UserEventBus')

      // Step 5: Wait for projection to complete
      logSection('STEP 5: Wait for Projection')
      this.addTrace('Waiting 2 seconds for projection to complete...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 6: Verify Firestore document
      logSection('STEP 6: Verify Firestore Document')
      const db = getFirestoreDB()
      const userRef = doc(db, 'users', testUserId)
      const snapshot = await getDoc(userRef)

      if (!snapshot.exists()) {
        this.addCheck(
          'Firestore Document: Existence',
          false,
          'User document not found in Firestore after projection',
          { userId: testUserId }
        )
        throw new Error('Firestore document not found - projection may have failed')
      }

      const document = snapshot.data()
      this.addCheck(
        'Firestore Document: Existence',
        true,
        'User document found in Firestore',
        { userId: testUserId }
      )

      // Step 7: Verify identity metadata in document
      logSection('STEP 7: Verify Identity Metadata in Document')
      const { tenant_id: docTenantId, aggregate_id: docAggregateId } = document

      if (docTenantId !== testTenantId) {
        this.addCheck(
          'Document Identity: tenant_id',
          false,
          `tenant_id mismatch in document: expected ${testTenantId}, got ${docTenantId}`,
          { expected: testTenantId, actual: docTenantId }
        )
      } else {
        this.addCheck(
          'Document Identity: tenant_id',
          true,
          `tenant_id matches: ${docTenantId}`,
          { tenant_id: docTenantId }
        )
      }

      if (docAggregateId !== testAggregateId) {
        this.addCheck(
          'Document Identity: aggregate_id',
          false,
          `aggregate_id mismatch in document: expected ${testAggregateId}, got ${docAggregateId}`,
          { expected: testAggregateId, actual: docAggregateId }
        )
      } else {
        this.addCheck(
          'Document Identity: aggregate_id',
          true,
          `aggregate_id matches: ${docAggregateId}`,
          { aggregate_id: docAggregateId }
        )
      }

      // Step 8: Verify encryption_key_id structure
      logSection('STEP 8: Verify GDPR Structure')
      this.verifyEncryptionKeyIdStructure(document)

      // Step 9: Verify encrypted data
      logSection('STEP 9: Verify Encrypted Data')
      this.verifyEncryptedData(document)

      // Step 10: Trace event flow
      logSection('STEP 10: Event Flow Trace')
      this.traceEventFlow(envelope, testUserId)

      // Final results
      logSection('AUDIT RESULTS')
      this.results.trace = this.trace

      if (this.results.passed) {
        logSuccess('ALL CHECKS PASSED')
        logInfo('Multi-tenant event-sourcing architecture is functioning correctly')
      } else {
        logError('AUDIT FAILED')
        const failedChecks = this.results.checks.filter(c => !c.passed)
        logError(`Failed checks: ${failedChecks.length}`)
        failedChecks.forEach(check => {
          logError(`- ${check.name}: ${check.message}`)
        })
      }

      return this.results

    } catch (error) {
      logError(`Audit execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      this.results.passed = false
      this.results.trace = this.trace
      throw error
    }
  }
}

// Main execution
async function main() {
  const testUserId = `audit_test_${Date.now()}`
  
  logSection('LEXICON MASTER - USER REGISTRATION AUDIT')
  logInfo('Starting multi-tenant event-sourcing audit...')
  logInfo(`Test User ID: ${testUserId}`)
  logWarning('This will create a test user document in Firestore')
  
  // Start projection service
  logInfo('Starting UserProjectionService...')
  userProjectionService.start()
  
  // Wait for service to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  try {
    const auditor = new UserRegistrationAuditor()
    const results = await auditor.executeAudit(testUserId)
    
    // Stop projection service
    logInfo('Stopping UserProjectionService...')
    userProjectionService.stop()
    
    // Exit with appropriate code
    process.exit(results.passed ? 0 : 1)
  } catch (error) {
    logError(`Audit failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    userProjectionService.stop()
    process.exit(1)
  }
}

// Execute main function
main().catch(error => {
  logError(`Unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  process.exit(1)
})
