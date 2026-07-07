// Simple script to demonstrate the integration test logs
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userProjectionService } from './src/services/userProjectionService'
import { userStore } from './src/entities/user'
import { dbService } from './src/services/db'
import type { UserRegistered, UserEmailVerified, UpdateProfile } from './src/entities/user'

// Mock dependencies
vi.mock('./src/services/db')
const mockDbService = vi.mocked(dbService)

describe('Integration Test Demonstration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbService.saveUserProfile = vi.fn().mockResolvedValue(undefined)
    mockDbService.loadUserProfile = vi.fn().mockImplementation(async (userId: string) => {
      if (userId === 'test-user-123') {
        return {
          id: userId,
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: false,
          createdAt: Date.now() - 10000,
          updatedAt: Date.now() - 5000,
          village: undefined,
          postcode: undefined,
          shareLocationForLeaderboard: false,
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: Date.now() - 5000,
          },
        }
      }
      return null
    })
  })

  it('demonstrates complete user journey with security validation', async () => {
    // Don't mock console - let all logs show through
    const testUserId = 'test-user-123'
    const testEmail = 'test@example.com'
    const testDisplayName = 'Test User'

    console.log('🚀 [INTEGRATION TEST] Starting end-to-end user journey simulation\n')

    // Step 1: Registration
    console.log('📝 [STEP 1] REGISTRATION - Triggering USER_REGISTERED event')
    console.log('='.repeat(60))
    
    const registrationEvent: UserRegistered = {
      type: 'user/registered',
      userId: testUserId,
      email: testEmail,
      displayName: testDisplayName,
      emailVerified: false,
      createdAt: Date.now(),
    }
    
    await userProjectionService.processUserEvent(registrationEvent)
    console.log('✅ [STEP 1] Registration event processed successfully\n')

    // Step 2: Profile Setup with valid data
    console.log('📍 [STEP 2] PROFILE SETUP - Dispatching UPDATE_PROFILE with valid location')
    console.log('='.repeat(60))
    
    const validProfileCommand: UpdateProfile = {
      type: 'profile/update',
      village: 'Pavlikeni',
      postcode: '5200',
      shareLocationForLeaderboard: true,
    }
    
    console.log('🎯 [COMMAND] Dispatching profile update command:', validProfileCommand)
    userStore.dispatch(validProfileCommand)
    
    const validProfileEvent = {
      type: 'profile/updated' as const,
      userId: testUserId,
      village: 'Pavlikeni',
      postcode: '5200',
      shareLocationForLeaderboard: true,
      timestamp: Date.now(),
    }
    
    await userProjectionService.processUserEvent(validProfileEvent)
    console.log('✅ [STEP 2] Valid profile update processed successfully\n')

    // Step 3: Email Verification
    console.log('✉️ [STEP 3] VERIFICATION - Triggering USER_EMAIL_VERIFIED event')
    console.log('='.repeat(60))
    
    const verificationEvent: UserEmailVerified = {
      type: 'user/email-verified',
      userId: testUserId,
      email: testEmail,
      verifiedAt: Date.now(),
    }
    
    await userProjectionService.processUserEvent(verificationEvent)
    console.log('✅ [STEP 3] Email verification processed successfully\n')

    // Step 4: Security Test with malicious input
    console.log('🛡️ [STEP 4] SECURITY TEST - Attempting malicious input in village field')
    console.log('='.repeat(60))
    
    const maliciousCommand: UpdateProfile = {
      type: 'profile/update',
      village: "<script>alert('xss')</script>",
      shareLocationForLeaderboard: false,
    }
    
    console.log('🎯 [COMMAND] Dispatching malicious profile update command:', maliciousCommand)
    userStore.dispatch(maliciousCommand)
    
    const maliciousEvent = {
      type: 'profile/updated' as const,
      userId: testUserId,
      village: "<script>alert('xss')</script>",
      timestamp: Date.now(),
    }
    
    console.log('⚠️ [SECURITY] Processing malicious event - should be blocked by validation')
    await userProjectionService.processUserEvent(maliciousEvent)
    console.log('✅ [STEP 4] Security validation successfully blocked malicious input\n')

    console.log('🎉 [INTEGRATION TEST] End-to-end user journey completed successfully!')
    console.log('📊 [SUMMARY] All steps executed:')
    console.log('   ✅ Registration processed')
    console.log('   ✅ Valid profile update saved')
    console.log('   ✅ Email verification processed')
    console.log('   ✅ Security validation blocked malicious input')
    console.log('   ✅ Data integrity maintained')

    // Verify the results
    expect(mockDbService.saveUserProfile).toHaveBeenCalledTimes(3)
    
    // Verify valid data was saved
    const validCall = mockDbService.saveUserProfile.mock.calls.find(call => 
      call[1].village === 'Pavlikeni' && call[1].postcode === '5200'
    )
    expect(validCall).toBeDefined()

    // Verify malicious input was NOT saved
    const maliciousCall = mockDbService.saveUserProfile.mock.calls.find(call => 
      call[1].village === "<script>alert('xss')</script>"
    )
    expect(maliciousCall).toBeUndefined()
  })
})
