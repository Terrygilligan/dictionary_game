import { useEffect } from 'react'
import { useGameState } from './useGame.ts'
import { useUserDispatch, useCurrentUser } from '@/entities/user/model/useUser.ts'
import { userService } from '@/services/userService'
import { useNavigationCleanup } from '@/shared/lib/navigation/useAtomicReset'
import { useIdentityReady } from './useIdentityReady'
import type { UserCommand } from '@/entities/user/model'

/**
 * Hook to automatically update user stats when a game finishes
 * Only works for authenticated users with resolved identity
 */
export function useGameStats() {
  const { isReady, tenant_id, aggregate_id } = useIdentityReady()
  const userDispatch = useUserDispatch()
  const currentUser = useCurrentUser()

  // useGameState now handles null identity parameters safely
  const gameState = useGameState(tenant_id, aggregate_id)

  // Register cleanup function for navigation changes
  useNavigationCleanup(() => {
    console.log('🧹 [GAME_STATS] Navigation cleanup - clearing game stats state')
  })

  useEffect(() => {
    // Only update stats when identity is ready, user is authenticated, and game finishes
    if (!isReady || !tenant_id || !aggregate_id || !gameState || !userDispatch || !currentUser) {
      return
    }

    console.log(`[GAME_STATS] Subscription attempt starting. tenant_id: ${tenant_id}, aggregate_id: ${aggregate_id}`)
    console.log('[GAME_STATS] Executing useGameState subscription')

    // Only update stats for authenticated users when game finishes
    if (gameState.status === 'finished') {
      console.log('📊 [GAME_STATS] Game finished, updating stats for user:', currentUser.id)
      
      // Calculate stats from the game state
      const correctAnswers = gameState.answers.filter(answer => answer.correct).length
      const totalQuestions = gameState.answers.length
      const currentStreak = gameState.streak
      
      // Find the highest streak from the answers
      let highestStreak = 0
      let currentStreakCount = 0
      
      gameState.answers.forEach(answer => {
        if (answer.correct) {
          currentStreakCount++
          highestStreak = Math.max(highestStreak, currentStreakCount)
        } else {
          currentStreakCount = 0
        }
      })

      // Get current stats from Firestore
      userService.loadUserStats(currentUser.id, 'game').then(currentStats => {
        // Handle case where user has no stats yet
        if (!currentStats) {
          console.log('No existing stats found for user, creating new stats entry')
          return
        }

        // Calculate new stats
        const newGamesPlayed = currentStats.gamesPlayed + 1
        const newCorrectAnswers = currentStats.correctAnswers + correctAnswers
        const newTotalQuestions = currentStats.totalQuestions + totalQuestions
        const newHighestStreak = Math.max(currentStats.highestStreak, highestStreak)

        // Dispatch stats update command with proper identity metadata
        const statsCommand: UserCommand = {
          type: 'stats/update',
          tenant_id,      // ✅ Identity compliance
          aggregate_id,  // ✅ Identity compliance
          gamesPlayed: newGamesPlayed,
          correctAnswers: newCorrectAnswers,
          totalQuestions: newTotalQuestions,
          streak: currentStreak,
          highestStreak: newHighestStreak,
        }

        console.log('📊 [GAME_STATS] Dispatching stats update:', statsCommand)
        userDispatch(statsCommand)

        // Save to Firestore
        const updatedStats = {
          gamesPlayed: newGamesPlayed,
          correctAnswers: newCorrectAnswers,
          totalQuestions: newTotalQuestions,
          streak: currentStreak,
          highestStreak: newHighestStreak,
          updatedAt: Date.now(),
        }

        userService.saveUserStats(currentUser.id, updatedStats, 'game')
      }).catch(error => {
        console.error('Failed to load/save user stats:', error)
      })
    }
  }, [isReady, tenant_id, aggregate_id, gameState, userDispatch, currentUser])
}
