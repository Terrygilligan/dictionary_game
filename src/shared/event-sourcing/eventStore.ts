import { createEventBus, type EventBus } from '../event-bus/index.ts'
import { nextId } from '../lib/id.ts'
import type { EventEnvelope, Evolve } from './types.ts'

export interface EventStore<TState, TEvent extends { type: string }> {
  /** The current state, derived entirely by folding the event log. */
  getState(): TState
  /** An immutable view of the committed event log. */
  getLog(): readonly EventEnvelope<TEvent>[]
  /** Commits events to the log, re-derives state, and notifies subscribers. */
  commit(events: readonly TEvent[]): readonly EventEnvelope<TEvent>[]
  /** Subscribe to state changes (for `useSyncExternalStore`). */
  subscribe(listener: () => void): () => void
  /** The underlying bus, for observing individual domain events. */
  readonly bus: EventBus<TEvent>
}

interface Clock {
  now(): number
}

export interface EventStoreOptions {
  clock?: Clock
}

/**
 * A tiny event-sourced store. State is never mutated directly: callers
 * {@link EventStore.commit} events, and the store re-derives state by folding
 * the *entire* immutable log through `evolve` from the seed. This makes the
 * log the single source of truth and guarantees replayable, deterministic
 * state (given deterministic events).
 */
export function createEventStore<TState, TEvent extends { type: string }>(
  evolve: Evolve<TState, TEvent>,
  seed: TState,
  options: EventStoreOptions = {},
): EventStore<TState, TEvent> {
  const clock = options.clock ?? { now: () => Date.now() }
  const bus = createEventBus<TEvent>()
  const changeListeners = new Set<() => void>()

  let log: readonly EventEnvelope<TEvent>[] = []
  let state: TState = seed

  const derive = (entries: readonly EventEnvelope<TEvent>[]): TState =>
    entries.reduce<TState>((acc, entry) => evolve(acc, entry.event), seed)

  return {
    getState: () => state,
    getLog: () => log,
    subscribe(listener) {
      changeListeners.add(listener)
      return () => {
        changeListeners.delete(listener)
      }
    },
    commit(events) {
      if (events.length === 0) return []
      const baseSeq = log.length
      const committed = events.map<EventEnvelope<TEvent>>((event, index) => ({
        id: nextId(),
        seq: baseSeq + index,
        timestamp: clock.now(),
        event,
      }))

      log = [...log, ...committed]
      state = derive(log)

      for (const entry of committed) bus.publish(entry.event)
      for (const listener of [...changeListeners]) listener()

      return committed
    },
    bus,
  }
}
