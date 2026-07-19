import type { Evolve } from '@/shared/event-sourcing'
import type { GameEvent } from './events.ts'
import type { GameState } from './types.ts'
import { createEmptyUserPerformanceState } from './types.ts'

export const initialGameState: GameState = {
  status: 'idle',
  deck: [],
  currentRound: 0,
  answers: [],
  streak: 0,
  currentLanguage: 'en',
  currentDifficulty: 5, // Default difficulty level
  current_milestone: 1, // Default to foundational milestone
  proficiency_map: new Map(),
  user_performance: createEmptyUserPerformanceState(),
}

/** Pure fold: `(state, event) -> nextState`. Exhaustive over `GameEvent`. */
export const evolveGame: Evolve<GameState, GameEvent> = (state, event) => {
  switch (event.type) {
    case 'game/started':
      return {
        status: 'playing',
        deck: event.deck,
        currentRound: 0,
        answers: [],
        streak: 0,
        currentLanguage: state.currentLanguage,
        currentDifficulty: state.currentDifficulty,
        current_milestone: event.milestone_id ?? state.current_milestone,
        proficiency_map: state.proficiency_map,
        user_performance: state.user_performance,
      }
    case 'answer/submitted':
      return {
        ...state,
        answers: [
          ...state.answers,
          {
            roundIndex: event.roundIndex,
            choiceId: event.choiceId,
            correct: event.correct,
          },
        ],
      }
    case 'round/advanced':
      return { ...state, currentRound: event.toRoundIndex }
    case 'streak/updated':
      return { ...state, streak: event.streak }
    case 'language/changed':
      return { ...state, currentLanguage: event.language }
    case 'game/finished':
      return { ...state, status: 'finished' }
    case 'difficulty/adjusted':
      return { ...state, currentDifficulty: event.newDifficulty }
    case 'audio/recorded':
      // Audio events are handled by AI agents, not game state evolution
      return state
    case 'audio/transcribed':
      // Audio transcribed events are handled by AI agents
      return state
    case 'audio/generation-failed':
      // Audio failure events are handled by AI agents
      return state
    case 'term/assigned':
      // Term assignment events are handled by AI agents
      return state
    case 'feedback/generated':
      // Feedback events are handled by AI agents
      return state
    case 'audio/ready':
      // Audio ready events are handled by UI components
      return state
    case 'audio/played':
      // Audio played events are handled by UI components
      return state
    case 'voice/settings-updated':
      // Voice settings are handled by configuration
      return state
    case 'game/reset':
      // Reset game to initial state
      return {
        ...initialGameState,
        currentLanguage: state.currentLanguage,
        currentDifficulty: state.currentDifficulty,
        current_milestone: state.current_milestone,
        proficiency_map: state.proficiency_map,
        user_performance: state.user_performance,
      }
    default:
      return assertNever(event)
  }
}

function assertNever(event: never): never {
  throw new Error(`Unhandled game event: ${JSON.stringify(event)}`)
}
