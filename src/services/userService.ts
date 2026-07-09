import { dbService } from './db'
import type { UserStats } from '@/entities/user'

/**
 * Service for managing user data and stats synchronization with Firestore
 */
export class UserService {
  /**
   * Save user stats to Firestore after game completion
   */
  async saveUserStats(userId: string, stats: UserStats, currentPage?: string): Promise<void> {
    // Subscription guard: only save when on profile or game pages
    if (currentPage && currentPage !== 'profile' && currentPage !== 'game') {
      console.log(`🛡️ [USER_SERVICE] Save blocked - not on profile/game page: ${currentPage}`)
      return
    }

    try {
      await dbService.saveUserStats(userId, stats)
      console.log(`✅ Stats saved to Firestore for user ${userId}`)
    } catch (error) {
      console.error('❌ Failed to save user stats to Firestore:', error)
      throw error
    }
  }

  /**
   * Load user stats from Firestore
   */
  async loadUserStats(userId: string, currentPage?: string): Promise<UserStats | null> {
    // Subscription guard: only load when on profile page
    if (currentPage && currentPage !== 'profile') {
      console.log(`🛡️ [USER_SERVICE] Load blocked - not on profile page: ${currentPage}`)
      return null
    }

    try {
      const stats = await dbService.loadUserStats(userId)
      if (stats) {
        console.log(`✅ Stats loaded from Firestore for user ${userId}`)
        return stats
      }
      
      // Return default stats if none exist
      const defaultStats: UserStats = {
        gamesPlayed: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        streak: 0,
        highestStreak: 0,
        updatedAt: Date.now(),
      }
      
      console.log(`📝 No stats found for user ${userId}, returning defaults`)
      return defaultStats
    } catch (error) {
      console.error('❌ Failed to load user stats from Firestore:', error)
      throw error
    }
  }

  /**
   * Calculate accuracy percentage from user stats
   */
  calculateAccuracy(stats: UserStats): number {
    if (stats.totalQuestions === 0) return 0
    return Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
  }
}

/**
 * Create and export user service instance
 */
export const userService = new UserService()

/**
 * Export user service type for dependency injection
 */
export type { UserService as IUserService }
