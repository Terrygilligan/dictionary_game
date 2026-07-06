import { useEffect } from 'react'
import { useGameState } from './useGame.ts'
import { useUserDispatch, useCurrentUser } from '@/entities/user/model/useUser.ts'
import { userService } from '@/services/userService'
import type { UserCommand } from '@/entities/user/model'

/**
 * Hook to automatically update user stats when a game finishes
 * Only works for authenticated users
 */
export function useGameStats() {
  const gameState = useGameState()
  const userDispatch = useUserDispatch()
  const currentUser = useCurrentUser()

  useEffect(() => {
    // Only update stats for authenticated users when game finishes
    if (gameState.status === 'finished' && userDispatch && currentUser) {
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
      userService.loadUserStats(currentUser.id).then(currentStats => {
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

        // Dispatch stats update command
        const statsCommand: UserCommand = {
          type: 'stats/update',
          gamesPlayed: newGamesPlayed,
          correctAnswers: newCorrectAnswers,
          totalQuestions: newTotalQuestions,
          streak: currentStreak,
          highestStreak: newHighestStreak,
        }

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

        userService.saveUserStats(currentUser.id, updatedStats)
      }).catch(error => {
        console.error('Failed to load/save user stats:', error)
      })
    }
  }, [gameState.status, gameState.answers, gameState.streak, userDispatch, currentUser])
}
