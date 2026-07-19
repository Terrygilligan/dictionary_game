import type { Decider } from '@/shared/event-sourcing'
import type { GameCommand } from './commands.ts'
import type { GameEvent } from './events.ts'
import type { GameState } from './types.ts'
import { selectCurrentRound, selectAnswerForRound } from './selectors.ts'

/**
 * Configuration for adaptive difficulty tuning
 */
interface AdaptiveDifficultyConfig {
  readonly lowPerformanceThreshold: number // Success rate below this triggers more review
  readonly highPerformanceThreshold: number // Success rate above this accelerates learning
  readonly defaultNewRatio: number // Default ratio of new words (0.7 = 70%)
  readonly reviewRatio: number // Ratio for struggling users (0.5 = 50%)
  readonly acceleratedRatio: number // Ratio for excelling users (0.8 = 80%)
}

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveDifficultyConfig = {
  lowPerformanceThreshold: 0.4, // 40% success rate triggers more review
  highPerformanceThreshold: 0.85, // 85% success rate accelerates learning
  defaultNewRatio: 0.7, // Default 70/30 split
  reviewRatio: 0.5, // Shift to 50/50 for struggling users
  acceleratedRatio: 0.8, // Shift to 80/20 for excelling users
}

/**
 * Calculate the adaptive SRS distribution based on user performance
 * 
 * @param state - Current game state with user performance data
 * @returns The ratio of new words to include (0.0 to 1.0)
 */
function calculateAdaptiveDistribution(state: GameState): number {
  const { user_performance, current_milestone } = state
  const config = DEFAULT_ADAPTIVE_CONFIG

  // If no performance data, use default distribution
  if (user_performance.totalAttempts === 0) {
    return config.defaultNewRatio
  }

  // Check global performance first
  if (user_performance.globalSuccessRate < config.lowPerformanceThreshold) {
    console.log('🎯 [ADAPTIVE] Low performance detected, shifting to 50/50 distribution')
    return config.reviewRatio
  }

  if (user_performance.globalSuccessRate > config.highPerformanceThreshold) {
    console.log('🚀 [ADAPTIVE] High performance detected, accelerating to 80/20 distribution')
    return config.acceleratedRatio
  }

  // Check current milestone performance for more granular tuning
  const currentMilestoneWords = Array.from(user_performance.wordPerformance.values())
    .filter(perf => perf.wordId.includes(`milestone_${current_milestone}`))
  
  if (currentMilestoneWords.length > 0) {
    const milestoneSuccessRate = currentMilestoneWords.reduce((sum, perf) => 
      sum + (perf.correct / perf.attempts), 0) / currentMilestoneWords.length

    if (milestoneSuccessRate < config.lowPerformanceThreshold) {
      console.log('🎯 [ADAPTIVE] Milestone struggling, shifting to 50/50 distribution')
      return config.reviewRatio
    }

    if (milestoneSuccessRate > config.highPerformanceThreshold) {
      console.log('🚀 [ADAPTIVE] Milestone excelling, accelerating to 80/20 distribution')
      return config.acceleratedRatio
    }
  }

  // Default distribution if no adaptive triggers
  return config.defaultNewRatio
}

/**
 * Check if user is ready for the next milestone based on proficiency
 * 
 * @param state - Current game state with proficiency data
 * @param targetMilestone - The milestone the user wants to access
 * @returns True if user is ready for the target milestone
 */
function isReadyForNextMilestone(state: GameState, targetMilestone: number): boolean {
  const { current_milestone, proficiency_map } = state

  // Cannot skip milestones
  if (targetMilestone > current_milestone + 1) {
    console.log('🚫 [GATEKEEPER] Cannot skip milestones')
    return false
  }

  // Same milestone is always allowed
  if (targetMilestone <= current_milestone) {
    return true
  }

  // Check if current milestone proficiency is sufficient (> 70% success rate)
  const currentMilestoneWords = Array.from(proficiency_map.values())
    .filter(word => word.wordId.includes(`milestone_${current_milestone}`))

  if (currentMilestoneWords.length === 0) {
    // No words attempted in current milestone, allow progression
    return true
  }

  const milestoneProficiency = currentMilestoneWords.reduce((sum, word) => 
    sum + (word.correct / word.total), 0) / currentMilestoneWords.length

  const isReady = milestoneProficiency > 0.7 // 70% threshold

  if (!isReady) {
    console.log(`🚫 [GATEKEEPER] Milestone ${current_milestone} proficiency ${(milestoneProficiency * 100).toFixed(1)}% below 70% threshold`)
  } else {
    console.log(`✅ [GATEKEEPER] Milestone ${current_milestone} proficiency ${(milestoneProficiency * 100).toFixed(1)}% sufficient for progression`)
  }

  return isReady
}

/**
 * Filter words based on difficulty threshold and user proficiency
 * 
 * @param words - Available words to filter
 * @param state - Current game state with proficiency data
 * @returns Filtered words appropriate for user's current level
 */
function filterWordsByDifficulty(
  words: readonly { wordId: string; difficulty?: number }[],
  state: GameState
): readonly { wordId: string; difficulty?: number }[] {
  const { current_milestone, proficiency_map } = state

  // If user is struggling with foundational words, filter out high difficulty
  const foundationalProficiency = Array.from(proficiency_map.values())
    .filter(word => word.wordId.includes('milestone_1'))
    .reduce((sum, word) => sum + (word.correct / word.total), 0) / 
    (proficiency_map.size || 1)

  if (foundationalProficiency < 0.6 && current_milestone === 1) {
    console.log('🎯 [DIFFICULTY] User struggling with foundational words, filtering high difficulty')
    return words.filter(word => 
      !word.difficulty || word.difficulty <= 5 // Only allow low-medium difficulty
    )
  }

  return words
}

/**
 * Pure decision function: given the current derived state and a command,
 * returns the events the command produces. Invalid commands yield `[]` so the
 * log only ever records legitimate transitions.
 */
export const decideGame: Decider<GameState, GameCommand, GameEvent> = (state, command) => {
  // Extract tenant and aggregate information from command
  const { tenant_id, aggregate_id } = command

  switch (command.type) {
    case 'startGame': {
      if (command.deck.length === 0) return []
      
      // Check milestone gatekeeper if milestone_id is provided
      if (command.milestone_id && !isReadyForNextMilestone(state, command.milestone_id)) {
        console.log('🚫 [DECIDE] StartGame rejected: Milestone gatekeeper check failed')
        return []
      }
      
      // Calculate adaptive distribution based on user performance
      const adaptiveRatio = calculateAdaptiveDistribution(state)
      
      // Apply difficulty filtering to the deck
      const filteredDeck = filterWordsByDifficulty(
        command.deck.map(round => ({ wordId: round.wordId, difficulty: round.milestone_id })),
        state
      )
      
      // If filtering removed all words, use original deck
      const finalDeck = filteredDeck.length > 0 
        ? command.deck.filter(round => filteredDeck.some(f => f.wordId === round.wordId))
        : command.deck
      
      console.log(`🎯 [ADAPTIVE] Using ${(adaptiveRatio * 100).toFixed(0)}% new word ratio, deck size: ${finalDeck.length}`)
      
      return [{ 
        type: 'game/started', 
        deck: finalDeck,
        milestone_id: command.milestone_id,
        game_mode: command.game_mode,
        tenant_id,
        aggregate_id
      }]
    }

    case 'submitAnswer': {
      if (state.status !== 'playing') return []
      const round = selectCurrentRound(state)
      if (!round) return []
      if (selectAnswerForRound(state, state.currentRound)) return []
      const choice = round.choices.find((c) => c.id === command.choiceId)
      if (!choice) return []
      const nextStreak = choice.correct ? state.streak + 1 : 0
      
      // DEBUG: Log answer submission for test debugging
      console.log('🔍 [DECIDE] Answer submitted:', {
        choiceId: command.choiceId,
        choiceCorrect: choice.correct,
        roundIndex: state.currentRound,
        nextStreak,
        tenant_id,
        aggregate_id
      })
      
      // Record the cause (the answer) before its effect (the streak change).
      return [
        {
          type: 'answer/submitted',
          roundIndex: state.currentRound,
          choiceId: choice.id,
          correct: choice.correct,
          tenant_id,
          aggregate_id,
        },
        { 
          type: 'streak/updated', 
          streak: nextStreak,
          tenant_id,
          aggregate_id
        },
      ]
    }

    case 'resetStreak': {
      if (state.streak === 0) return []
      return [{ 
        type: 'streak/updated', 
        streak: 0,
        tenant_id,
        aggregate_id
      }]
    }

    case 'nextRound': {
      if (state.status !== 'playing') return []
      if (!selectAnswerForRound(state, state.currentRound)) return []
      const isLastRound = state.currentRound >= state.deck.length - 1
      if (isLastRound) {
        const correct = state.answers.filter((a) => a.correct).length
        return [{ 
          type: 'game/finished', 
          correct, 
          total: state.deck.length,
          tenant_id,
          aggregate_id
        }]
      }
      return [{ 
        type: 'round/advanced', 
        toRoundIndex: state.currentRound + 1,
        tenant_id,
        aggregate_id
      }]
    }

    case 'setLanguage': {
      if (state.currentLanguage === command.language) return []
      return [{ 
        type: 'language/changed', 
        language: command.language,
        tenant_id,
        aggregate_id
      }]
    }

    case 'resetGame': {
      return [{ 
        type: 'game/reset', 
        reason: command.reason,
        tenant_id,
        aggregate_id
      }]
    }

    default:
      return assertNever(command)
  }
}

function assertNever(command: never): never {
  throw new Error(`Unhandled game command: ${JSON.stringify(command)}`)
}
