import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEventStore } from './eventStore.ts'
import { resetIdFactory, setIdFactory } from '../lib/id.ts'

type CounterEvent = { type: 'incremented'; by: number } | { type: 'reset' }

const evolve = (state: number, event: CounterEvent): number =>
  event.type === 'incremented' ? state + event.by : 0

afterEach(() => {
  resetIdFactory()
  vi.restoreAllMocks()
})

describe('createEventStore', () => {
  it('derives state purely from the committed log', () => {
    const store = createEventStore(evolve, 0)
    store.commit([{ type: 'incremented', by: 2 }, { type: 'incremented', by: 3 }])
    expect(store.getState()).toBe(5)
    store.commit([{ type: 'reset' }])
    expect(store.getState()).toBe(0)
    expect(store.getLog()).toHaveLength(3)
  })

  it('assigns monotonic sequence numbers and metadata', () => {
    let n = 0
    setIdFactory(() => `ev-${(n += 1)}`)
    const clock = { now: () => 1000 }
    const store = createEventStore(evolve, 0, { clock })
    store.commit([{ type: 'incremented', by: 1 }])
    store.commit([{ type: 'incremented', by: 1 }])
    const log = store.getLog()
    expect(log.map((e) => e.seq)).toEqual([0, 1])
    expect(log.map((e) => e.id)).toEqual(['ev-1', 'ev-2'])
    expect(log.every((e) => e.timestamp === 1000)).toBe(true)
  })

  it('notifies change subscribers once per commit', () => {
    const store = createEventStore(evolve, 0)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    store.commit([{ type: 'incremented', by: 1 }])
    store.commit([{ type: 'incremented', by: 1 }])
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    store.commit([{ type: 'incremented', by: 1 }])
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('does nothing when committing an empty batch', () => {
    const store = createEventStore(evolve, 0)
    const listener = vi.fn()
    store.subscribe(listener)
    expect(store.commit([])).toEqual([])
    expect(listener).not.toHaveBeenCalled()
  })

  it('publishes each event on the bus', () => {
    const store = createEventStore(evolve, 0)
    const seen: CounterEvent[] = []
    store.bus.subscribeAll((event) => seen.push(event))
    store.commit([{ type: 'incremented', by: 4 }, { type: 'reset' }])
    expect(seen).toEqual([{ type: 'incremented', by: 4 }, { type: 'reset' }])
  })
})
