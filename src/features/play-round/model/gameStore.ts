import {
  decideGame,
  evolveGame,
  initialGameState,
  type GameCommand,
  type GameEvent,
  type GameState,
} from '@/entities/game'
import { createEventStore, type EventStore, type EventStoreOptions } from '@/shared/event-sourcing'

export interface GameStore extends EventStore<GameState, GameEvent> {
  /** Runs a command through the decider and commits any resulting events. */
  dispatch(command: GameCommand): void
}

/**
 * Wires the pure domain (decider + evolver) to an event store, yielding a
 * command-driven store: `dispatch(command) -> decide -> commit -> re-derive`.
 */
export function createGameStore(options: EventStoreOptions = {}): GameStore {
  const store = createEventStore<GameState, GameEvent>(evolveGame, initialGameState, options)

  return {
    ...store,
    dispatch(command) {
      store.commit(decideGame(store.getState(), command))
    },
  }
}
