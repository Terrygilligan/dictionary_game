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
      // Use default tenant/aggregate for single-player games
      const tenant_id = command.tenant_id || 'game-tenant'
      const aggregate_id = command.aggregate_id || 'game-session'
      
      // Enhance command with tenant/aggregate if not provided
      const enhancedCommand = {
        ...command,
        tenant_id,
        aggregate_id,
      }
      
      console.log(`🎮 [STORE] Dispatching command:`, command.type, { tenant_id, aggregate_id })
      
      const events = decideGame(store.getState(tenant_id, aggregate_id), enhancedCommand)
      console.log(`🎮 [STORE] Generated events:`, events.length, events)
      
      store.commit(events, tenant_id, aggregate_id)
      
      const newState = store.getState(tenant_id, aggregate_id)
      console.log(`🎮 [STORE] New state:`, newState.status)
    },
  }
}
