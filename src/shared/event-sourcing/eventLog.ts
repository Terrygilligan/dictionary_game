import { nextId } from '../lib/id.ts'
import type { EventEnvelope, Evolve } from './types.ts'

/**
 * A match's persisted event log — the offline, event-mirrored source of truth.
 *
 * The whole game is reconstructible by folding {@link EventLog.events} through an
 * `evolve` function; nothing else needs to be stored, and no runtime API call is
 * required to rebuild state (manifesto: *offline-first*).
 *
 * The "Event object" is {@link EventEnvelope}: `{ id, seq, timestamp, event }`.
 */
export interface EventLog<TEvent extends { type: string }> {
  /** Scopes the log to a single match/game. */
  readonly matchId: string
  /** When the log was opened (epoch ms). */
  readonly createdAt: number
  /** Append-only, `seq`-ordered events — the single source of truth. */
  readonly events: readonly EventEnvelope<TEvent>[]
}

interface Clock {
  now(): number
}

export interface EventLogServiceOptions<TEvent extends { type: string }> {
  /** Existing log to resume from (e.g. loaded from disk). */
  readonly initialLog?: EventLog<TEvent>
  /** Injectable clock; defaults to the wall clock. */
  readonly clock?: Clock
}

/**
 * Manages one match's {@link EventLog}: appends events (stamping identity,
 * ordering and time at the edge), exports the log to JSON for file-based
 * storage, and replays it to reconstruct state.
 *
 * `append` is the only impure surface (clock + id). `replay`/`toJSON` are pure
 * given the current log, so a serialized log always rebuilds identical state.
 */
export interface EventLogService<TState, TEvent extends { type: string }> {
  /** The current, immutable log. */
  getLog(): EventLog<TEvent>
  /** Appends raw domain events, returning the committed envelopes. */
  append(events: readonly TEvent[]): readonly EventEnvelope<TEvent>[]
  /** Serialises the whole log to JSON for offline/file storage. */
  toJSON(): string
  /** Replays the log to reconstruct state (pure fold from `seed`). */
  replay(evolve: Evolve<TState, TEvent>, seed: TState): TState
}

/**
 * Pure fold of an event log's payloads into state — the reconstruction
 * primitive. Deterministic: identical logs yield identical state.
 */
export function replayLog<TState, TEvent extends { type: string }>(
  evolve: Evolve<TState, TEvent>,
  seed: TState,
  log: EventLog<TEvent>,
): TState {
  return log.events.reduce<TState>((state, entry) => evolve(state, entry.event), seed)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isEnvelope = (value: unknown): value is EventEnvelope<{ type: string }> =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.seq === 'number' &&
  typeof value.timestamp === 'number' &&
  isRecord(value.event) &&
  typeof (value.event as { type?: unknown }).type === 'string'

/**
 * Parse + validate a JSON-serialised {@link EventLog}. Throws on malformed
 * input so a corrupt file can never masquerade as a valid match.
 */
export function eventLogFromJSON<TEvent extends { type: string }>(json: string): EventLog<TEvent> {
  const parsed: unknown = JSON.parse(json)
  if (
    !isRecord(parsed) ||
    typeof parsed.matchId !== 'string' ||
    typeof parsed.createdAt !== 'number' ||
    !Array.isArray(parsed.events) ||
    !parsed.events.every(isEnvelope)
  ) {
    throw new Error('Malformed event log JSON')
  }
  return parsed as unknown as EventLog<TEvent>
}

export function createEventLogService<TState, TEvent extends { type: string }>(
  matchId: string,
  options: EventLogServiceOptions<TEvent> = {},
): EventLogService<TState, TEvent> {
  const clock = options.clock ?? { now: () => Date.now() }

  let log: EventLog<TEvent> = options.initialLog ?? {
    matchId,
    createdAt: clock.now(),
    events: [],
  }

  return {
    getLog: () => log,
    append(events) {
      if (events.length === 0) return []
      const baseSeq = log.events.length
      const committed = events.map<EventEnvelope<TEvent>>((event, index) => ({
        id: nextId(),
        seq: baseSeq + index,
        timestamp: clock.now(),
        event,
      }))
      log = { ...log, events: [...log.events, ...committed] }
      return committed
    },
    toJSON: () => JSON.stringify(log),
    replay: (evolve, seed) => replayLog(evolve, seed, log),
  }
}
