import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userProjectionService } from './userProjectionService'
import { dbService } from './db'
import type { UserRegistered, UserCreated, UserEmailVerified } from '@/entities/user'

// Mock dependencies
vi.mock('./db')
vi.mock('@/shared/lib/security/cryptoShreddingBrowser')

const mockDbService = vi.mocked(dbService)

describe('UserProjectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbService.saveUserProfile = vi.fn().mockResolvedValue(undefined)
    mockDbService.loadUserProfile = vi.fn().mockResolvedValue(null)
  })

  describe('processUserEvent', () => {
    it('should process user/registered events', async () => {
      const event: UserRegistered = {
        type: 'user/registered',
        userId: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        createdAt: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: false,
          createdAt: event.createdAt,
          updatedAt: expect.any(String),
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: expect.any(Number),
          },
          metadata: {
            source: 'user-projection',
            eventType: 'user/registered',
            processedAt: expect.any(String),
          },
        })
      )
    })

    it('should process user/created events', async () => {
      const event: UserCreated = {
        type: 'user/created',
        userId: 'user456',
        email: 'created@example.com',
        displayName: 'Created User',
        createdAt: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user456',
        expect.objectContaining({
          id: 'user456',
          email: 'created@example.com',
          displayName: 'Created User',
          emailVerified: false,
          createdAt: event.createdAt,
          updatedAt: expect.any(String),
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: expect.any(Number),
          },
          metadata: {
            source: 'user-projection',
            eventType: 'user/created',
            processedAt: expect.any(String),
          },
        })
      )
    })

    it('should handle profile/updated events with existing profile', async () => {
      const existingProfile = {
        id: 'user789',
        email: 'existing@example.com',
        displayName: 'Existing User',
        emailVerified: true,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        stats: {
          gamesPlayed: 5,
          correctAnswers: 3,
          totalQuestions: 10,
          streak: 2,
          highestStreak: 3,
          updatedAt: Date.now() - 500,
        },
      }

      mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

      const event = {
        type: 'profile/updated' as const,
        userId: 'user789',
        totalScore: 100,
        matchesPlayed: 10,
        timestamp: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.loadUserProfile).toHaveBeenCalledWith('user789')
      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user789',
        expect.objectContaining({
          ...existingProfile,
          updatedAt: expect.any(String),
          metadata: {
            source: 'user-projection',
            eventType: 'profile/updated',
            processedAt: expect.any(String),
          },
          totalScore: 100,
          matchesPlayed: 10,
        })
      )
    })

    it('should handle stats/updated events with existing profile', async () => {
      const existingProfile = {
        id: 'user999',
        email: 'stats@example.com',
        displayName: 'Stats User',
        emailVerified: true,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        stats: {
          gamesPlayed: 5,
          correctAnswers: 3,
          totalQuestions: 10,
          streak: 2,
          highestStreak: 3,
          updatedAt: Date.now() - 500,
        },
      }

      mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

      const event = {
        type: 'stats/updated' as const,
        userId: 'user999',
        gamesPlayed: 6,
        correctAnswers: 4,
        totalQuestions: 12,
        streak: 3,
        highestStreak: 4,
        timestamp: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.loadUserProfile).toHaveBeenCalledWith('user999')
      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user999',
        expect.objectContaining({
          ...existingProfile,
          updatedAt: expect.any(String),
          metadata: {
            source: 'user-projection',
            eventType: 'stats/updated',
            processedAt: expect.any(String),
          },
          gamesPlayed: 6,
          correctAnswers: 4,
          totalQuestions: 12,
          streak: 3,
          highestStreak: 4,
        })
      )
    })

    it('should create basic profile when none exists for profile/updated', async () => {
      mockDbService.loadUserProfile.mockResolvedValue(null)

      const event = {
        type: 'profile/updated' as const,
        userId: 'newuser',
        totalScore: 50,
        matchesPlayed: 5,
        timestamp: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      // Should have called handleUserProjection to create a basic profile
      expect(mockDbService.saveUserProfile).toHaveBeenCalled()
    })

    it('should create basic profile when none exists for stats/updated', async () => {
      mockDbService.loadUserProfile.mockResolvedValue(null)

      const event = {
        type: 'stats/updated' as const,
        userId: 'newstatsuser',
        gamesPlayed: 1,
        correctAnswers: 1,
        totalQuestions: 2,
        streak: 1,
        highestStreak: 1,
        timestamp: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      // Should have called handleUserProjection to create a basic profile
      expect(mockDbService.saveUserProfile).toHaveBeenCalled()
    })

    it('should log debug information for all events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const event: UserRegistered = {
        type: 'user/registered',
        userId: 'debuguser',
        email: 'debug@example.com',
        displayName: 'Debug User',
        emailVerified: false,
        createdAt: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] User event received:', expect.objectContaining({
        type: 'user/registered',
        userId: 'debuguser',
      }))

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] Handling user projection for:', expect.objectContaining({
        userId: 'debuguser',
        eventType: 'user/registered',
      }))

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] About to save user profile for:', expect.objectContaining({
        userId: 'debuguser',
      }))

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] Writing profile to Firestore for user:', 'debuguser')

      expect(consoleSpy).toHaveBeenCalledWith('✅ [PROJECTION] User profile saved to Firestore for user debuguser')

      consoleSpy.mockRestore()
    })

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDbService.saveUserProfile.mockRejectedValue(new Error('Firestore error'))
      
      const event: UserRegistered = {
        type: 'user/registered',
        userId: 'erroruser',
        email: 'error@example.com',
        displayName: 'Error User',
        emailVerified: false,
        createdAt: Date.now(),
      }

      await expect(userProjectionService.processUserEvent(event)).rejects.toThrow('Firestore error')

      expect(consoleSpy).toHaveBeenCalledWith('❌ [PROJECTION] Failed to save user profile for user erroruser:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should handle user/email-verified events', async () => {
      const existingProfile = {
        id: 'verifiedUser',
        email: 'verified@example.com',
        displayName: 'Verified User',
        emailVerified: false,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 500,
        stats: {
          gamesPlayed: 5,
          correctAnswers: 3,
          totalQuestions: 10,
          streak: 2,
          highestStreak: 3,
          updatedAt: Date.now() - 500,
        },
      }

      mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

      const event: UserEmailVerified = {
        type: 'user/email-verified',
        userId: 'verifiedUser',
        email: 'verified@example.com',
        verifiedAt: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.loadUserProfile).toHaveBeenCalledWith('verifiedUser')
      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'verifiedUser',
        expect.objectContaining({
          ...existingProfile,
          emailVerified: true,
          updatedAt: expect.any(String),
          metadata: {
            source: 'user-projection',
            eventType: 'user/email-verified',
            processedAt: expect.any(String),
            verifiedAt: expect.any(String),
          },
        })
      )
    })

    it('should handle user/email-verified events when no profile exists', async () => {
      mockDbService.loadUserProfile.mockResolvedValue(null)

      const event: UserEmailVerified = {
        type: 'user/email-verified',
        userId: 'nonexistentUser',
        email: 'nonexistent@example.com',
        verifiedAt: Date.now(),
      }

      await userProjectionService.processUserEvent(event)

      expect(mockDbService.loadUserProfile).toHaveBeenCalledWith('nonexistentUser')
      expect(mockDbService.saveUserProfile).not.toHaveBeenCalled()
    })

    describe('Location Field Validation', () => {
      it('should process valid location fields correctly', async () => {
        const existingProfile = {
          id: 'userLocation',
          email: 'location@example.com',
          displayName: 'Location User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userLocation',
          village: 'Springfield',
          postcode: 'SW1A 1AA',
          shareLocationForLeaderboard: true,
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        expect(mockDbService.loadUserProfile).toHaveBeenCalledWith('userLocation')
        expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
          'userLocation',
          expect.objectContaining({
            ...existingProfile,
            updatedAt: expect.any(String),
            metadata: {
              source: 'user-projection',
              eventType: 'profile/updated',
              processedAt: expect.any(String),
            },
            village: 'Springfield',
            postcode: 'SW1A 1AA',
            shareLocationForLeaderboard: true,
          })
        )
      })

      it('should reject malicious input in village field', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const existingProfile = {
          id: 'userMalicious',
          email: 'malicious@example.com',
          displayName: 'Malicious User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userMalicious',
          village: '<script>alert("xss")</script>',
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        // Should have logged validation error
        expect(consoleLogSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validating location fields for user:', 'userMalicious')
        expect(consoleSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validation failed for user userMalicious:', expect.stringContaining('Invalid village format'))
        expect(consoleSpy).toHaveBeenCalledWith('🚫 [SECURITY] Profile update aborted due to invalid input')

        // Should NOT have saved the profile
        expect(mockDbService.saveUserProfile).not.toHaveBeenCalled()

        consoleSpy.mockRestore()
        consoleLogSpy.mockRestore()
      })

      it('should reject malicious input in postcode field', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const existingProfile = {
          id: 'userPostcodeMalicious',
          email: 'postcode@example.com',
          displayName: 'Postcode Malicious User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userPostcodeMalicious',
          postcode: 'SELECT * FROM users; --',
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        // Should have logged validation error
        expect(consoleLogSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validating location fields for user:', 'userPostcodeMalicious')
        expect(consoleSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validation failed for user userPostcodeMalicious:', expect.stringContaining('Invalid postcode format'))
        expect(consoleSpy).toHaveBeenCalledWith('🚫 [SECURITY] Profile update aborted due to invalid input')

        // Should NOT have saved the profile
        expect(mockDbService.saveUserProfile).not.toHaveBeenCalled()

        consoleSpy.mockRestore()
        consoleLogSpy.mockRestore()
      })

      it('should reject village field that is too short', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const existingProfile = {
          id: 'userShortVillage',
          email: 'short@example.com',
          displayName: 'Short Village User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userShortVillage',
          village: 'A', // Too short (less than 2 characters)
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        expect(consoleSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validation failed for user userShortVillage:', expect.stringContaining('Invalid village format'))
        expect(mockDbService.saveUserProfile).not.toHaveBeenCalled()

        consoleSpy.mockRestore()
        consoleLogSpy.mockRestore()
      })

      it('should reject village field that is too long', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        
        const existingProfile = {
          id: 'userLongVillage',
          email: 'long@example.com',
          displayName: 'Long Village User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userLongVillage',
          village: 'A'.repeat(51), // Too long (more than 50 characters)
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        expect(consoleSpy).toHaveBeenCalledWith('🛡️ [SECURITY] Validation failed for user userLongVillage:', expect.stringContaining('Invalid village format'))
        expect(mockDbService.saveUserProfile).not.toHaveBeenCalled()

        consoleSpy.mockRestore()
        consoleLogSpy.mockRestore()
      })

      it('should allow valid special characters in location fields', async () => {
        const existingProfile = {
          id: 'userSpecialChars',
          email: 'special@example.com',
          displayName: 'Special Chars User',
          emailVerified: true,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 500,
          stats: {
            gamesPlayed: 5,
            correctAnswers: 3,
            totalQuestions: 10,
            streak: 2,
            highestStreak: 3,
            updatedAt: Date.now() - 500,
          },
        }

        mockDbService.loadUserProfile.mockResolvedValue(existingProfile)

        const event = {
          type: 'profile/updated' as const,
          userId: 'userSpecialChars',
          village: 'St-Johns Wood', // Valid: letters, spaces, hyphens
          postcode: 'SW1A-1AA', // Valid: letters, numbers, hyphens
          timestamp: Date.now(),
        }

        await userProjectionService.processUserEvent(event)

        expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
          'userSpecialChars',
          expect.objectContaining({
            village: 'St-Johns Wood',
            postcode: 'SW1A-1AA',
          })
        )
      })
    })
  })
})
