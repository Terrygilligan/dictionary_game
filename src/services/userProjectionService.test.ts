import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userProjectionService } from './userProjectionService'
import { dbService } from './db'
import { encryptUserProfile } from '@/shared/lib/security/cryptoShreddingBrowser'
import type { UserRegistered, UserCreated } from '@/entities/user'

// Mock dependencies
vi.mock('./db')
vi.mock('@/shared/lib/security/cryptoShreddingBrowser')

const mockDbService = vi.mocked(dbService)

describe('UserProjectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbService.saveUserProfile = vi.fn().mockResolvedValue(undefined)
    mockDbService.loadUserProfile = vi.fn().mockResolvedValue(null)
    vi.mocked(encryptUserProfile).mockResolvedValue({
      encrypted: 'encrypted-data',
      iv: 'iv-string',
    })
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

      expect(vi.mocked(encryptUserProfile)).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        createdAt: event.createdAt,
        updatedAt: expect.any(Number),
        stats: {
          gamesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          streak: 0,
          highestStreak: 0,
          updatedAt: expect.any(Number),
        }
      })

      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          encrypted: 'encrypted-data',
          iv: 'iv-string',
          updatedAt: expect.any(String),
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

      expect(vi.mocked(encryptUserProfile)).toHaveBeenCalledWith({
        id: 'user456',
        email: 'created@example.com',
        displayName: 'Created User',
        emailVerified: false,
        createdAt: event.createdAt,
        updatedAt: expect.any(Number),
        stats: {
          gamesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          streak: 0,
          highestStreak: 0,
          updatedAt: expect.any(Number),
        }
      })

      expect(mockDbService.saveUserProfile).toHaveBeenCalledWith(
        'user456',
        expect.objectContaining({
          encrypted: 'encrypted-data',
          iv: 'iv-string',
          updatedAt: expect.any(String),
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
      expect(vi.mocked(encryptUserProfile)).toHaveBeenCalledWith({
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
      expect(vi.mocked(encryptUserProfile)).toHaveBeenCalledWith({
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

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] About to encrypt user profile for:', expect.objectContaining({
        userId: 'debuguser',
      }))

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [PROJECTION] Writing encrypted profile to Firestore for user:', 'debuguser')

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
  })
})
