import '@testing-library/jest-dom/vitest'

// Mock Firebase Auth for deterministic testing
// This ensures tests don't depend on external Firebase services
vi.mock('@/features/play-round/model/useFirebaseAuth.ts', () => ({
  useFirebaseAuth: () => ({
    user: {
      id: 'test-tenant-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        streak: 0,
        highestStreak: 0,
        updatedAt: Date.now(),
      },
    },
    isLoading: false,
    isAuthenticated: true,
    getCurrentUser: () => ({
      id: 'test-tenant-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        streak: 0,
        highestStreak: 0,
        updatedAt: Date.now(),
      },
    }),
    tenant_id: 'test-tenant-123',
  }),
  useGameIdentity: () => ({
    tenant_id: 'test-tenant-123',
    aggregate_id: 'test-session-456',
  }),
}))

// Mock crypto.randomUUID for deterministic session IDs
let mockUuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      mockUuidCounter += 1
      return `test-session-${mockUuidCounter}`
    },
  },
})
