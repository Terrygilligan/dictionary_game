/**
 * A minimal, dependency-free publish/subscribe event bus.
 *
 * The bus is intentionally generic: it knows nothing about the game domain.
 * Producers `publish` events, consumers `subscribe` to a channel (or to all
 * events via `subscribeAll`). Listeners never receive a mutable reference to
 * internal state — every payload they observe is exactly what was published.
 */
export type Listener<TEvent> = (event: TEvent) => void

export interface EventBus<TEvent extends { type: string }> {
  publish(event: TEvent): void
  subscribe<TType extends TEvent['type']>(
    type: TType,
    listener: Listener<Extract<TEvent, { type: TType }>>,
  ): () => void
  subscribeAll(listener: Listener<TEvent>): () => void
}

export function createEventBus<TEvent extends { type: string }>(): EventBus<TEvent> {
  const channels = new Map<string, Set<Listener<TEvent>>>()
  const wildcard = new Set<Listener<TEvent>>()

  const channelFor = (type: string): Set<Listener<TEvent>> => {
    let set = channels.get(type)
    if (!set) {
      set = new Set()
      channels.set(type, set)
    }
    return set
  }

  return {
    publish(event) {
      // Snapshot listeners so a handler that (un)subscribes mid-dispatch
      // cannot corrupt the iteration.
      for (const listener of [...channelFor(event.type)]) listener(event)
      for (const listener of [...wildcard]) listener(event)
    },

    subscribe(type, listener) {
      const set = channelFor(type)
      set.add(listener as Listener<TEvent>)
      return () => {
        set.delete(listener as Listener<TEvent>)
      }
    },

    subscribeAll(listener) {
      wildcard.add(listener)
      return () => {
        wildcard.delete(listener)
      }
    },
  }
}
