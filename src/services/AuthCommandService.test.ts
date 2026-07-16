/**
 * Simple test to verify AuthCommandService functionality
 * This test ensures the service properly creates correlation IDs and handles commands
 */

import { authCommandService, CorrelationHelper } from './AuthCommandService'
import type { RegisterUserCommand, SignInCommand } from './AuthCommandService'
import { authService } from './auth'
import { userStore } from '@/entities/user'
import { vi, beforeEach, describe, it, expect } from 'vitest'

vi.mock('./auth')
vi.mock('@/entities/user')
vi.mock('@/shared/events/OutboxManager', () => ({
  outboxManager: {
    publishSingleAtomically: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('AuthCommandService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CorrelationHelper', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = CorrelationHelper.generateCorrelationId()
      const id2 = CorrelationHelper.generateCorrelationId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('should generate valid ISO timestamps', () => {
      const timestamp = CorrelationHelper.generateTimestamp()
      
      expect(timestamp).toBeDefined()
      expect(new Date(timestamp)).toBeInstanceOf(Date)
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('Command Creation', () => {
    it('should create a valid RegisterUserCommand', () => {
      const command: RegisterUserCommand = {
        type: 'REGISTER_USER',
        correlationId: CorrelationHelper.generateCorrelationId(),
        timestamp: CorrelationHelper.generateTimestamp(),
        payload: {
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
          acceptTerms: true,
        },
      }

      expect(command.type).toBe('REGISTER_USER')
      expect(command.correlationId).toBeDefined()
      expect(command.timestamp).toBeDefined()
      expect(command.payload.email).toBe('test@example.com')
      expect(command.payload.acceptTerms).toBe(true)
    })

    it('should create a valid SignInCommand', () => {
      const command: SignInCommand = {
        type: 'SIGN_IN',
        correlationId: CorrelationHelper.generateCorrelationId(),
        timestamp: CorrelationHelper.generateTimestamp(),
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      }

      expect(command.type).toBe('SIGN_IN')
      expect(command.correlationId).toBeDefined()
      expect(command.timestamp).toBeDefined()
      expect(command.payload.email).toBe('test@example.com')
    })
  })

  describe('Service Integration', () => {
    it('should handle successful registration', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
        createdAt: Date.now(),
        stats: {
          gamesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          streak: 0,
          highestStreak: 0,
          updatedAt: Date.now(),
        },
      }

      vi.mocked(authService.signUp).mockResolvedValue({
        success: true,
        user: mockUser,
      })

      const command: RegisterUserCommand = {
        type: 'REGISTER_USER',
        correlationId: CorrelationHelper.generateCorrelationId(),
        timestamp: CorrelationHelper.generateTimestamp(),
        payload: {
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
          acceptTerms: true,
        },
      }

      const result = await authCommandService.registerUser(command)

      expect(result.success).toBe(true)
      expect(result.correlationId).toBe(command.correlationId)
      expect(result.user).toEqual(mockUser)
      expect(authService.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      )
      expect(userStore.dispatch).toHaveBeenCalled()
    })

    it('should handle registration failure', async () => {
      vi.mocked(authService.signUp).mockResolvedValue({
        success: false,
        error: 'Email already exists',
      })

      const command: RegisterUserCommand = {
        type: 'REGISTER_USER',
        correlationId: CorrelationHelper.generateCorrelationId(),
        timestamp: CorrelationHelper.generateTimestamp(),
        payload: {
          email: 'existing@example.com',
          password: 'password123',
          displayName: 'Existing User',
          acceptTerms: true,
        },
      }

      const result = await authCommandService.registerUser(command)

      expect(result.success).toBe(false)
      expect(result.correlationId).toBe(command.correlationId)
      expect(result.error).toBe('Email already exists')
      expect(result.user).toBeUndefined()
      expect(userStore.dispatch).not.toHaveBeenCalled()
    })
  })
})

export {} // Make this a module
