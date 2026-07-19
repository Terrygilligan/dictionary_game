import type { Decider } from '@/shared/event-sourcing'
import type { GameCommand } from './commands.ts'
import type { GameEvent } from './events.ts'
import type { GameState } from './types.ts'
import { selectCurrentRound, selectAnswerForRound } from './selectors.ts'

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
        return []
      }
      
      // Apply difficulty filtering to the deck
      const filteredDeck = filterWordsByDifficulty(
        command.deck.map(round => ({ wordId: round.wordId, difficulty: round.milestone_id })),
        state
      )
      
      // If filtering removed all words, use original deck
      const finalDeck = filteredDeck.length > 0 
        ? command.deck.filter(round => filteredDeck.some(f => f.wordId === round.wordId))
        : command.deck
      
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
