import {
  decideGame,
  evolveGame,
  initialGameState,
  type GameCommand,
  type GameEvent,
  type GameState,
} from '@/entities/game'
import { createEventStore, type EventStore, type EventStoreOptions } from '@/shared/event-sourcing'
import { gameEventBus, createGameEventEnvelope } from '@/entities/game/model/GameEventBus'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('STORE')

export interface GameStore extends EventStore<GameState, GameEvent> {
  /** Runs a command through the decider and commits any resulting events. */
  dispatch(command: GameCommand): void
}

/**
 * Wires the pure domain (decider + evolver) to an event store.
 * ENFORCES strict command identity compliance - no fallbacks allowed.
 */
export function createGameStore(options: EventStoreOptions = {}): GameStore {
  const store = createEventStore<GameState, GameEvent>(evolveGame, initialGameState, options)

  return {
    ...store,
    dispatch(command) {
      // STRICT ENFORCEMENT: No fallbacks, no enhancement
      if (!command.tenant_id || !command.tenant_id.trim()) {
        throw new Error('COMMAND_IDENTITY_VIOLATION: Missing mandatory tenant_id')
      }

      if (!command.aggregate_id || !command.aggregate_id.trim()) {
        throw new Error('COMMAND_IDENTITY_VIOLATION: Missing mandatory aggregate_id')
      }

      logger.log(`Dispatching command:`, command.type, {
        tenant_id: command.tenant_id,
        aggregate_id: command.aggregate_id,
        command: command
      })

      // Pure domain processing - command used exactly as received
      const currentState = store.getState(command.tenant_id, command.aggregate_id)
      logger.log(`Current state before decision:`, currentState.status)

      const events = decideGame(currentState, command)
      logger.log(`Generated events:`, events.length, events)

      store.commit(events, command.tenant_id, command.aggregate_id)

      // Publish events to GameEventBus for audit trail and projections
      events.forEach(event => {
        const correlationId = crypto.randomUUID()
        const envelope = createGameEventEnvelope(
          command.tenant_id,
          command.aggregate_id,
          correlationId,
          event
        )
        gameEventBus.publish(envelope)
        logger.log(`Published event to GameEventBus:`, event.type, { correlationId })
      })

      const newState = store.getState(command.tenant_id, command.aggregate_id)
      logger.log(`New state:`, newState.status)
    },
  }
}

/** Shared application game store. */
export const gameStore = createGameStore()
