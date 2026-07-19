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
      // Extract word metadata from the event (telemetry-ready payload)
      const wordId = (event as any).wordId
      const semanticGroup = (event as any).semanticGroup ?? 'default'
      const eventTimestamp = (event as any).timestamp ?? Date.now()

      // Update proficiency map for spaced repetition tracking
      const updatedProficiency = new Map(state.proficiency_map)
      if (wordId) {
        const existingProficiency = updatedProficiency.get(wordId) || {
          wordId,
          correct: 0,
          total: 0,
          lastAttemptedAt: undefined,
        }
        updatedProficiency.set(wordId, {
          wordId,
          correct: existingProficiency.correct + (event.correct ? 1 : 0),
          total: existingProficiency.total + 1,
          lastAttemptedAt: eventTimestamp,
        })
      }

      // Update user performance state for adaptive difficulty tuning
      const updatedWordPerformance = new Map(state.user_performance.wordPerformance)
      const updatedGroupPerformance = new Map(state.user_performance.groupPerformance)
      
      if (wordId) {
        // Update word-level performance
        const existingWordPerf = updatedWordPerformance.get(wordId) || {
          wordId,
          semantic_group: semanticGroup,
          attempts: 0,
          correct: 0,
          lastAttemptedAt: undefined,
        }
        updatedWordPerformance.set(wordId, {
          wordId,
          semantic_group: semanticGroup,
          attempts: existingWordPerf.attempts + 1,
          correct: existingWordPerf.correct + (event.correct ? 1 : 0),
          lastAttemptedAt: eventTimestamp,
        })

        // Update semantic group performance
        const existingGroupPerf = updatedGroupPerformance.get(semanticGroup) || {
          semantic_group: semanticGroup,
          totalAttempts: 0,
          correctAnswers: 0,
          successRate: 0,
        }
        const newGroupAttempts = existingGroupPerf.totalAttempts + 1
        const newGroupCorrect = existingGroupPerf.correctAnswers + (event.correct ? 1 : 0)
        updatedGroupPerformance.set(semanticGroup, {
          semantic_group: semanticGroup,
          totalAttempts: newGroupAttempts,
          correctAnswers: newGroupCorrect,
          successRate: newGroupCorrect / newGroupAttempts,
        })
      }

      // Recalculate global success rate
      const newTotalAttempts = state.user_performance.totalAttempts + 1
      const newTotalCorrect = state.user_performance.wordPerformance.size === 0
        ? (event.correct ? 1 : 0)
        : Array.from(updatedWordPerformance.values()).reduce((sum, wp) => sum + wp.correct, 0)
      const newGlobalSuccessRate = newTotalAttempts > 0 ? newTotalCorrect / newTotalAttempts : 0

      const updatedUserPerformance = {
        wordPerformance: updatedWordPerformance,
        groupPerformance: updatedGroupPerformance,
        globalSuccessRate: newGlobalSuccessRate,
        totalAttempts: newTotalAttempts,
      }

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
        proficiency_map: updatedProficiency,
        user_performance: updatedUserPerformance,
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
