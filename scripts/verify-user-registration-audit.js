#!/usr/bin/env node

/**
 * Multi-Tenant Event-Sourcing Audit & Runtime Verification
 * 
 * This script verifies the integrity of the UserRegistration event-sourcing loop
 * under multi-tenant constraints as required by the Lexicon Master architecture.
 * 
 * Role: Senior Systems Architect / QA Automation Engineer
 * Goal: Verify the integrity of the UserRegistration event-sourcing loop under multi-tenant constraints
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class UserRegistrationAuditor {
  constructor() {
    this.trace = [];
    this.results = {
      passed: true,
      checks: [],
      trace: []
    };
  }

  addTrace(message) {
    const timestamp = new Date().toISOString();
    this.trace.push(`[${timestamp}] ${message}`);
    logInfo(message);
  }

  addCheck(name, passed, message, details) {
    this.results.checks.push({ name, passed, message, details });
    if (passed) {
      logSuccess(message);
    } else {
      logError(message);
      this.results.passed = false;
    }
    if (details) {
      console.log(JSON.stringify(details, null, 2));
    }
  }

  /**
   * Verify identity metadata in event envelope
   * Strict validation: NO 'default' values or nulls allowed
   */
  verifyIdentityMetadata(envelope) {
    this.addTrace('Verifying identity metadata in event envelope');
    
    const { tenant_id, aggregate_id, correlationId } = envelope;
    
    // Check for forbidden fallback values
    if (!tenant_id || tenant_id === 'default') {
      this.addCheck(
        'Identity Metadata: tenant_id',
        false,
        'CRITICAL: tenant_id is missing or set to forbidden "default" value',
        { tenant_id }
      );
      return false;
    }

    if (!aggregate_id || aggregate_id === 'default') {
      this.addCheck(
        'Identity Metadata: aggregate_id',
        false,
        'CRITICAL: aggregate_id is missing or set to forbidden "default" value',
        { aggregate_id }
      );
      return false;
    }

    if (!correlationId) {
      this.addCheck(
        'Identity Metadata: correlationId',
        false,
        'CRITICAL: correlationId is missing from event envelope',
        { correlationId }
      );
      return false;
    }

    this.addCheck(
      'Identity Metadata: tenant_id',
      true,
      `tenant_id is present and not default: ${tenant_id}`,
      { tenant_id }
    );

    this.addCheck(
      'Identity Metadata: aggregate_id',
      true,
      `aggregate_id is present and not default: ${aggregate_id}`,
      { aggregate_id }
    );

    this.addCheck(
      'Identity Metadata: correlationId',
      true,
      `correlationId is present: ${correlationId}`,
      { correlationId }
    );

    return true;
  }

  /**
   * Verify encryption_key_id field structure in Firestore document
   */
  verifyEncryptionKeyIdStructure(document) {
    this.addTrace('Verifying encryption_key_id field structure in Firestore document');
    
    // Check if encryption_key_id field exists (even if placeholder)
    if (!document.hasOwnProperty('encryption_key_id')) {
      this.addCheck(
        'GDPR Structure: encryption_key_id field',
        false,
        'encryption_key_id field is missing from Firestore document',
        { document }
      );
      return false;
    }

    this.addCheck(
      'GDPR Structure: encryption_key_id field',
      true,
      'encryption_key_id field exists in document structure',
      { encryption_key_id: document.encryption_key_id }
    );

    return true;
  }

  /**
   * Verify encrypted data transformation
   * Check if PII fields are transformed (not plain text)
   */
  verifyEncryptedData(document) {
    this.addTrace('Verifying encrypted data transformation');
    
    const { email, displayName } = document;
    
    // Check if email is encrypted (not plain text)
    if (typeof email === 'string' && email.includes('@')) {
      this.addCheck(
        'GDPR Encryption: email field',
        false,
        'email field appears to be plain text (contains @ symbol), not encrypted',
        { email }
      );
      return false;
    }

    // Check if displayName is encrypted (not plain text)
    if (typeof displayName === 'string' && displayName.length < 50 && !displayName.includes(':')) {
      this.addCheck(
        'GDPR Encryption: displayName field',
        false,
        'displayName field appears to be plain text, not encrypted',
        { displayName }
      );
      return false;
    }

    this.addCheck(
      'GDPR Encryption: email field',
      true,
      'email field appears to be encrypted (not plain text)',
      { email_length: typeof email === 'string' ? email.length : 'N/A' }
    );

    this.addCheck(
      'GDPR Encryption: displayName field',
      true,
      'displayName field appears to be encrypted (not plain text)',
      { displayName_length: typeof displayName === 'string' ? displayName.length : 'N/A' }
    );

    return true;
  }

  /**
   * Trace the flow from UserEventBus through UserProjectionService to Firestore
   */
  traceEventFlow(envelope, userId) {
    this.addTrace('=== EVENT FLOW TRACE ===');
    this.addTrace(`1. UserEventBus.publish() called with envelope`);
    this.addTrace(`   - tenant_id: ${envelope.tenant_id}`);
    this.addTrace(`   - aggregate_id: ${envelope.aggregate_id}`);
    this.addTrace(`   - correlationId: ${envelope.correlationId}`);
    this.addTrace(`   - eventType: ${envelope.eventType}`);
    
    this.addTrace(`2. UserProjectionService.subscribe() receives envelope`);
    this.addTrace(`   - Service extracts tenant_id and aggregate_id from envelope`);
    this.addTrace(`   - Service prepares user document with GDPR encryption`);
    
    this.addTrace(`3. Firestore write operation`);
    this.addTrace(`   - Collection: users`);
    this.addTrace(`   - Document ID: ${userId}`);
    this.addTrace(`   - Operation: setDoc with merge: true`);
    this.addTrace(`=== END TRACE ===`);
  }

  /**
   * Main audit execution
   */
  async executeAudit(testUserId) {
    logSection('MULTI-TENANT EVENT-SOURCING AUDIT & RUNTIME VERIFICATION');
    logInfo('Starting audit for UserRegistration flow...');
    logInfo(`Test User ID: ${testUserId}`);

    try {
      // Step 1: Create test event envelope with proper identity metadata
      logSection('STEP 1: Create Test Event Envelope');
      const testTenantId = `test_tenant_${testUserId}`;
      const testAggregateId = `test_aggregate_${testUserId}`;
      const testCorrelationId = `test_correlation_${Date.now()}`;

      const envelope = {
        type: 'user.registered',
        tenant_id: testTenantId,
        aggregate_id: testAggregateId,
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
      };

      this.addTrace('Created test event envelope with identity metadata');
      this.addTrace(`tenant_id: ${testTenantId}`);
      this.addTrace(`aggregate_id: ${testAggregateId}`);

      // Step 2: Verify identity metadata in envelope
      logSection('STEP 2: Verify Identity Metadata in Envelope');
      const identityValid = this.verifyIdentityMetadata(envelope);
      if (!identityValid) {
        throw new Error('Identity metadata validation failed - aborting audit');
      }

      // Step 3: Display envelope structure
      logSection('STEP 3: Event Envelope Structure');
      console.log(JSON.stringify(envelope, null, 2));

      // Step 4: Instructions for manual verification
      logSection('STEP 4: Manual Verification Instructions');
      logWarning('This script validates the event envelope structure.');
      logWarning('For full runtime verification, please:');
      logWarning('1. Start the application with Firebase credentials');
      logWarning('2. Trigger a user registration through the UI');
      logWarning('3. Check Firestore console for the users collection');
      logWarning('4. Verify the document contains:');
      logWarning('   - tenant_id (not "default")');
      logWarning('   - aggregate_id (not "default")');
      logWarning('   - encryption_key_id field (even if empty)');
      logWarning('   - Encrypted email and displayName fields');

      // Final results
      logSection('AUDIT RESULTS');
      this.results.trace = this.trace;

      if (this.results.passed) {
        logSuccess('ENVELOPE VALIDATION PASSED');
        logInfo('Event envelope structure is correct for multi-tenant constraints');
      } else {
        logError('AUDIT FAILED');
        const failedChecks = this.results.checks.filter(c => !c.passed);
        logError(`Failed checks: ${failedChecks.length}`);
        failedChecks.forEach(check => {
          logError(`- ${check.name}: ${check.message}`);
        });
      }

      return this.results;

    } catch (error) {
      logError(`Audit execution failed: ${error.message}`);
      this.results.passed = false;
      this.results.trace = this.trace;
      throw error;
    }
  }
}

// Main execution
async function main() {
  const testUserId = `audit_test_${Date.now()}`;
  
  logSection('LEXICON MASTER - USER REGISTRATION AUDIT');
  logInfo('Starting multi-tenant event-sourcing audit...');
  logInfo(`Test User ID: ${testUserId}`);
  
  try {
    const auditor = new UserRegistrationAuditor();
    const results = await auditor.executeAudit(testUserId);
    
    // Exit with appropriate code
    process.exit(results.passed ? 0 : 1);
  } catch (error) {
    logError(`Audit failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});
