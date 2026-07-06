import type { Evolve } from '@/shared/event-sourcing'
import type { GameEvent } from './events.ts'
import type { GameState } from './types.ts'

export const initialGameState: GameState = {
  status: 'idle',
  deck: [],
  currentRound: 0,
  answers: [],
  streak: 0,
  currentLanguage: 'en',
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
    default:
      return assertNever(event)
  }
}

function assertNever(event: never): never {
  throw new Error(`Unhandled game event: ${JSON.stringify(event)}`)
}
