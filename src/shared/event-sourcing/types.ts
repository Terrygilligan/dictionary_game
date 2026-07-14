/**
 * Every event that has been committed to the log is wrapped in an envelope
 * carrying identity and ordering metadata. The envelope is immutable; the
 * derived state is *only ever* a fold over these envelopes' `event` payloads.
 * 
 * Following Event-Driven Architecture Blueprint compliance with explicit multi-tenant isolation.
 */
export interface EventEnvelope<TEvent extends { type: string }> {
  readonly id: string
  readonly seq: number
  readonly timestamp: number
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (game session, entity instance) */
  readonly aggregate_id: string
  /** Duplicated from event.type for the EventBus channel routing. */
  readonly type: TEvent['type']
  readonly event: TEvent
}

/** Folds the previous state and a single event into the next state. Must be pure. */
export type Evolve<TState, TEvent> = (state: TState, event: TEvent) => TState

/** Turns an intent (command) into the events it produces. Must be pure. */
export type Decider<TState, TCommand, TEvent> = (
  state: TState,
  command: TCommand,
) => readonly TEvent[]
