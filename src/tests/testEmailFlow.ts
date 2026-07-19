/**
 * Email Flow Test Script
 * 
 * Tests the email queue functionality by:
 * 1. Creating a test user via AuthService.signUp
 * 2. Verifying the email_queue document is created with correct structure
 * 3. Cleaning up the test user
 */

import { authService } from '@/services/auth'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
import { getFirebaseAuth } from '@/shared/api/firebase'
import { deleteUser } from 'firebase/auth'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('EMAIL_FLOW_TEST')

/**
 * Test configuration
 */
const TEST_CONFIG = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'password123',
  displayName: 'testUser',
}

/**
 * Verify email queue document exists with correct structure
 */
async function verifyEmailQueueDocument(userId: string): Promise<boolean> {
  try {
    const firestore = getFirestore()
    const emailQueueRef = collection(firestore, 'email_queue')
    const q = query(emailQueueRef, where('userId', '==', userId), where('template', '==', 'welcome_registration'))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      logger.error('No email queue document found for user:', userId)
      return false
    }

    // Verify the document structure
    const doc = querySnapshot.docs[0]
    if (!doc) {
      logger.error('No document found in query snapshot')
      return false
    }

    const data = doc.data()

    logger.log('✅ Email queue document found:', {
      docId: doc.id,
      email: data.email,
      template: data.template,
      userId: data.userId,
      data: data.data,
      status: data.status,
    })

    // Validate required fields
    const validations = [
      { field: 'email', expected: TEST_CONFIG.email, actual: data.email },
      { field: 'template', expected: 'welcome_registration', actual: data.template },
      { field: 'userId', expected: userId, actual: data.userId },
      { field: 'data.username', expected: TEST_CONFIG.displayName, actual: data.data?.username },
      { field: 'status', expected: 'pending', actual: data.status },
    ]

    let allValid = true
    for (const validation of validations) {
      if (validation.actual === validation.expected) {
        logger.log(`✅ ${validation.field} validation passed:`, validation.actual)
      } else {
        logger.error(`❌ ${validation.field} validation failed:`, {
          expected: validation.expected,
          actual: validation.actual,
        })
        allValid = false
      }
    }

    return allValid
  } catch (error) {
    logger.error('Failed to verify email queue document:', error)
    return false
  }
}

/**
 * Cleanup test user from Firebase Auth
 */
async function cleanupTestUser(): Promise<void> {
  try {
    const auth = getFirebaseAuth()
    const currentUser = auth.currentUser

    if (currentUser) {
      await deleteUser(currentUser)
      logger.log('✅ Test user deleted from Firebase Auth:', currentUser.email)
    } else {
      logger.warn('No current user to delete')
    }
  } catch (error) {
    logger.error('Failed to cleanup test user:', error)
  }
}

/**
 * Main test function
 */
export async function runEmailFlowTest(): Promise<void> {
  logger.log('🚀 Starting email flow test...')
  logger.log('Test configuration:', TEST_CONFIG)

  try {
    // Step 1: Create test user via AuthService.signUp
    logger.log('Step 1: Creating test user via AuthService.signUp...')
    const signUpResult = await authService.signUp(
      TEST_CONFIG.email,
      TEST_CONFIG.password,
      TEST_CONFIG.displayName
    )

    if (!signUpResult.success || !signUpResult.user) {
      throw new Error('Failed to create test user: ' + signUpResult.error)
    }

    logger.log('✅ Test user created successfully:', {
      userId: signUpResult.user.id,
      email: signUpResult.user.email,
      displayName: signUpResult.user.displayName,
    })

    // Wait a moment for Firestore to propagate
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Step 2: Verify email queue document
    logger.log('Step 2: Verifying email queue document...')
    const verificationResult = await verifyEmailQueueDocument(signUpResult.user.id)

    if (!verificationResult) {
      throw new Error('Email queue document verification failed')
    }

    logger.log('✅ Email queue document verification passed')

    // Step 3: Cleanup
    logger.log('Step 3: Cleaning up test user...')
    await cleanupTestUser()

    logger.log('🎉 Email flow test completed successfully!')

  } catch (error) {
    logger.error('❌ Email flow test failed:', error)

    // Attempt cleanup even if test failed
    try {
      await cleanupTestUser()
    } catch (cleanupError) {
      logger.error('Failed to cleanup after test failure:', cleanupError)
    }

    throw error
  }
}

/**
 * Run test if this file is executed directly
 */
if (import.meta.env.PROD !== true) {
  runEmailFlowTest()
    .then(() => {
      logger.log('Test completed')
      process.exit(0)
    })
    .catch((error) => {
      logger.error('Test failed:', error)
      process.exit(1)
    })
}
