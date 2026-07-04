/**
 * Every event that has been committed to the log is wrapped in an envelope
 * carrying identity and ordering metadata. The envelope is immutable; the
 * derived state is *only ever* a fold over these envelopes' `event` payloads.
 */
export interface EventEnvelope<TEvent> {
  readonly id: string
  readonly seq: number
  readonly timestamp: number
  readonly event: TEvent
}

/** Folds the previous state and a single event into the next state. Must be pure. */
export type Evolve<TState, TEvent> = (state: TState, event: TEvent) => TState

/** Turns an intent (command) into the events it produces. Must be pure. */
export type Decider<TState, TCommand, TEvent> = (
  state: TState,
  command: TCommand,
) => readonly TEvent[]
