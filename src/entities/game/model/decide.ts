import type { Decider } from '@/shared/event-sourcing'
import type { GameCommand } from './commands.ts'
import type { GameEvent } from './events.ts'
import type { GameState } from './types.ts'
import { selectCurrentRound, selectAnswerForRound } from './selectors.ts'

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
      return [{ 
        type: 'game/started', 
        deck: command.deck,
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
