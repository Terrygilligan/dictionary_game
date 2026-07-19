/**
 * Vocabulary Seeder Script
 * 
 * Command-based seeder that reads vocabulary.manifest.json and dispatches
 * addWordDefinition commands to the vocabulary decider.
 * 
 * Architectural Compliance:
 * - Event-Sourced: Uses domain commands, not direct database writes
 * - Idempotent: Checks for existing entries before dispatching
 * - Multi-Tenant: Uses DEFAULT_TENANT_ID for all operations
 * - Resilient: Logs errors and continues, doesn't crash on single failures
 * 
 * Usage: ts-node src/scripts/seed-vocabulary.ts
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_TENANT_ID } from '../shared/config/tenant.js'
import { validateEntry, validateManifest } from '../shared/lib/vocabulary/validator.js'
import { decideVocabulary, initialVocabularyState } from '../entities/vocabulary/model/decide.js'
import type { VocabularyManifest, VocabularyEntry } from '../entities/vocabulary/model/types.js'

/**
 * Configuration for the seeder
 */
interface SeederConfig {
  readonly manifestPath: string
  readonly tenantId: string
  readonly aggregateId: string
  readonly dryRun: boolean
}

/**
 * Seeder statistics
 */
interface SeederStats {
  totalEntries: number
  validatedEntries: number
  failedValidations: number
  dispatchedCommands: number
  skippedDuplicates: number
  errors: string[]
}

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebaseAdmin(): void {
  try {
    // In production, you would use a service account
    // For development, we'll use the emulator or environment config
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'lexicon-master-adb6b',
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      })
    } else {
      // Use application default credentials or emulator
      admin.initializeApp({
        projectId: serviceAccount.projectId,
      })
    }

    console.log('✅ [SEEDER] Firebase Admin SDK initialized')
  } catch (error) {
    console.error('❌ [SEEDER] Failed to initialize Firebase Admin SDK:', error)
    throw error
  }
}

/**
 * Load vocabulary manifest from JSON file
 */
function loadManifest(manifestPath: string): VocabularyManifest {
  try {
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    const manifest: VocabularyManifest = JSON.parse(manifestContent)
    console.log(`✅ [SEEDER] Loaded manifest from ${manifestPath}`)
    console.log(`📊 [SEEDER] Manifest contains ${manifest.entries.length} entries`)
    return manifest
  } catch (error) {
    console.error(`❌ [SEEDER] Failed to load manifest from ${manifestPath}:`, error)
    throw error
  }
}

/**
 * Check if a vocabulary entry already exists in the event log
 * This provides idempotency - prevents duplicate events
 */
async function entryExists(tenantId: string, wordId: string): Promise<boolean> {
  try {
    const db = admin.firestore()
    
    // Query game_event_logs for existing vocabulary events
    const snapshot = await db
      .collection('game_event_logs')
      .where('tenant_id', '==', tenantId)
      .where('type', '==', 'vocabulary/wordDefinitionAdded')
      .where('wordId', '==', wordId)
      .limit(1)
      .get()

    const exists = !snapshot.empty
    if (exists) {
      console.log(`⏭️  [SEEDER] Entry ${wordId} already exists, skipping (idempotent)`)
    }
    return exists
  } catch (error) {
    console.error(`⚠️  [SEEDER] Error checking if entry ${wordId} exists:`, error)
    // On error, assume it doesn't exist to allow seeding
    return false
  }
}

/**
 * Dispatch a vocabulary command to the outbox
 * 
 * Instead of writing directly to data collections, we write to the outbox
 * collection. The OutboxProcessor will then handle the event processing.
 */
async function dispatchCommand(
  tenantId: string,
  aggregateId: string,
  entry: VocabularyEntry,
  dryRun: boolean
): Promise<boolean> {
  try {
    const command = {
      tenant_id: tenantId,
      aggregate_id: aggregateId,
      type: 'vocabulary/addWordDefinition' as const,
      entry,
    }

    // Use the decider to validate the command and generate events
    const events = decideVocabulary(initialVocabularyState, command)

    if (events.length === 0) {
      console.log(`⚠️  [SEEDER] No events generated for entry ${entry.id} (validation failed or duplicate)`)
      return false
    }

    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would dispatch command for entry ${entry.id}`)
      console.log(`   Events: ${events.map(e => e.type).join(', ')}`)
      return true
    }

    // Write events to outbox collection for processing
    const db = admin.firestore()
    const outboxRef = db.collection('outbox')
    
    for (const event of events) {
      const outboxId = `vocab_${entry.id}_${Date.now()}`
      await outboxRef.doc(outboxId).set({
        id: outboxId,
        topic: `vocabulary.${event.type.replace('vocabulary/', '')}`,
        payload: event,
        correlationId: entry.id,
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: 0,
      })
    }

    console.log(`✅ [SEEDER] Dispatched command for entry ${entry.id}`)
    return true
  } catch (error) {
    console.error(`❌ [SEEDER] Failed to dispatch command for entry ${entry.id}:`, error)
    return false
  }
}

/**
 * Main seeder function
 */
async function seedVocabulary(config: SeederConfig): Promise<SeederStats> {
  const stats: SeederStats = {
    totalEntries: 0,
    validatedEntries: 0,
    failedValidations: 0,
    dispatchedCommands: 0,
    skippedDuplicates: 0,
    errors: [],
  }

  // Override entryExists for dry-run mode
  const checkEntryExists = config.dryRun 
    ? async () => false // Always return false in dry-run (no duplicates)
    : entryExists

  try {
    console.log('🚀 [SEEDER] Starting vocabulary seeding process')
    console.log(`📋 [SEEDER] Configuration:`, {
      manifestPath: config.manifestPath,
      tenantId: config.tenantId,
      aggregateId: config.aggregateId,
      dryRun: config.dryRun,
    })

    // Load and validate manifest
    const manifest = loadManifest(config.manifestPath)
    const manifestValidation = validateManifest(manifest)

    if (!manifestValidation.valid) {
      throw new Error(`Manifest validation failed: ${manifestValidation.errors.join(', ')}`)
    }

    stats.totalEntries = manifest.entries.length
    console.log(`✅ [SEEDER] Manifest validation passed`)

    // Process each entry
    for (const entry of manifest.entries) {
      console.log(`\n📝 [SEEDER] Processing entry: ${entry.id} (${entry.word})`)

      try {
        // Validate individual entry
        const entryValidation = validateEntry(entry)
        if (!entryValidation.valid) {
          console.error(`❌ [SEEDER] Entry validation failed for ${entry.id}:`, entryValidation.errors)
          stats.failedValidations++
          stats.errors.push(`Entry ${entry.id}: ${entryValidation.errors.join(', ')}`)
          continue
        }

        stats.validatedEntries++
        console.log(`✅ [SEEDER] Entry validation passed for ${entry.id}`)

        // Check for duplicates (idempotency)
        const exists = await checkEntryExists(config.tenantId, entry.id)
        if (exists) {
          stats.skippedDuplicates++
          continue
        }

        // Dispatch command
        const dispatched = await dispatchCommand(
          config.tenantId,
          config.aggregateId,
          entry,
          config.dryRun
        )

        if (dispatched) {
          stats.dispatchedCommands++
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ [SEEDER] Error processing entry ${entry.id}:`, error)
        stats.errors.push(`Entry ${entry.id}: ${errorMessage}`)
        // Continue processing other entries (resilience)
      }
    }

    console.log('\n📊 [SEEDER] Seeding completed')
    console.log('📈 [SEEDER] Statistics:', {
      totalEntries: stats.totalEntries,
      validatedEntries: stats.validatedEntries,
      failedValidations: stats.failedValidations,
      dispatchedCommands: stats.dispatchedCommands,
      skippedDuplicates: stats.skippedDuplicates,
      errorCount: stats.errors.length,
    })

    if (stats.errors.length > 0) {
      console.log('\n⚠️  [SEEDER] Errors encountered:')
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    return stats

  } catch (error) {
    console.error('❌ [SEEDER] Fatal error during seeding:', error)
    throw error
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('🚀 [SEEDER] Starting main execution')
    
    // Configuration
    const config: SeederConfig = {
      manifestPath: join(process.cwd(), 'src/shared/data/vocabulary.manifest.json'),
      tenantId: DEFAULT_TENANT_ID,
      aggregateId: 'vocabulary_seeder', // System aggregate for seeding operations
      dryRun: process.env.DRY_RUN === 'true',
    }

    console.log('📋 [SEEDER] Configuration loaded')

    // Only initialize Firebase if not in dry-run mode
    if (!config.dryRun) {
      initializeFirebaseAdmin()
    } else {
      console.log('🔍 [SEEDER] Running in DRY-RUN mode')
    }

    // Run seeder
    console.log('📊 [SEEDER] Calling seedVocabulary...')
    const stats = await seedVocabulary(config)
    console.log('📊 [SEEDER] seedVocabulary completed')

    // Exit with appropriate code
    if (stats.failedValidations > 0 || stats.errors.length > 0) {
      console.log('\n⚠️  [SEEDER] Completed with errors')
      process.exit(1)
    } else {
      console.log('\n✅ [SEEDER] Completed successfully')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ [SEEDER] Fatal error:', error)
    console.error('❌ [SEEDER] Error stack:', error instanceof Error ? error.stack : 'No stack available')
    process.exit(1)
  }
}

// Run if executed directly
main().catch(error => {
  console.error('❌ [SEEDER] Unhandled error:', error)
  process.exit(1)
})

export { seedVocabulary, initializeFirebaseAdmin }
