/**
 * Test script for Vocabulary Projection Service
 * 
 * This script processes existing vocabulary events from the outbox collection
 * and projects them to the vocabulary_definitions collection.
 * 
 * Usage: npx tsx src/scripts/test-vocabulary-projection.ts
 */

import admin from 'firebase-admin'
import { VocabularyProjectionService } from '../entities/vocabulary/projection/index.js'

// Initialize Firebase Admin for the script
function initializeFirebaseAdmin(): void {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'lexicon-master-adb6b',
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      })
    } else {
      admin.initializeApp({
        projectId: serviceAccount.projectId,
      })
    }

    console.log('✅ [TEST_PROJECTION] Firebase Admin SDK initialized')
  } catch (error) {
    console.error('❌ [TEST_PROJECTION] Failed to initialize Firebase Admin SDK:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 [TEST_PROJECTION] Starting vocabulary projection test')
  
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin()
    
    // Initialize the projection service
    const projectionService = new VocabularyProjectionService()
    
    console.log('✅ [TEST_PROJECTION] Projection service initialized')
    
    // Process existing events from outbox
    console.log('📦 [TEST_PROJECTION] Processing existing vocabulary events...')
    await projectionService.processExistingEvents()
    
    console.log('✅ [TEST_PROJECTION] Vocabulary projection test completed successfully')
    console.log('📊 [TEST_PROJECTION] Check your Firestore vocabulary_definitions collection for results')
    
  } catch (error) {
    console.error('❌ [TEST_PROJECTION] Test failed:', error)
    process.exit(1)
  }
}

main()
