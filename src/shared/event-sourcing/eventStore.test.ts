import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEventStore } from './eventStore.ts'
import { resetIdFactory, setIdFactory } from '../lib/id.ts'
import type { EventEnvelope } from './types.ts'

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
    store.commit([{ type: 'incremented', by: 2 }, { type: 'incremented', by: 3 }], 'tenant-123', 'aggregate-456')
    expect(store.getState('tenant-123', 'aggregate-456')).toBe(5)
    store.commit([{ type: 'reset' }], 'tenant-123', 'aggregate-456')
    expect(store.getState('tenant-123', 'aggregate-456')).toBe(0)
    expect(store.getLog('tenant-123', 'aggregate-456')).toHaveLength(3)
  })

  it('assigns monotonic sequence numbers and metadata', () => {
    let n = 0
    setIdFactory(() => `ev-${(n += 1)}`)
    const clock = { now: () => 1000 }
    const store = createEventStore(evolve, 0, { clock })
    store.commit([{ type: 'incremented', by: 1 }], 'tenant-123', 'aggregate-456')
    store.commit([{ type: 'incremented', by: 1 }], 'tenant-123', 'aggregate-456')
    const log = store.getLog('tenant-123', 'aggregate-456')
    expect(log.map((e) => e.seq)).toEqual([0, 1])
    expect(log.map((e) => e.id)).toEqual(['ev-1', 'ev-2'])
    expect(log.every((e) => e.timestamp === 1000)).toBe(true)
  })

  it('notifies change subscribers once per commit', () => {
    const store = createEventStore(evolve, 0)
    const listener = vi.fn()
    const unsubscribe = store.subscribe('tenant-123', 'aggregate-456', listener)
    store.commit([{ type: 'incremented', by: 1 }], 'tenant-123', 'aggregate-456')
    store.commit([{ type: 'incremented', by: 1 }], 'tenant-123', 'aggregate-456')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    store.commit([{ type: 'incremented', by: 1 }], 'tenant-123', 'aggregate-456')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('does nothing when committing an empty batch', () => {
    const store = createEventStore(evolve, 0)
    const listener = vi.fn()
    store.subscribe('tenant-123', 'aggregate-456', listener)
    expect(store.commit([], 'tenant-123', 'aggregate-456')).toEqual([])
    expect(listener).not.toHaveBeenCalled()
  })

  it('publishes each full EventEnvelope on the bus', () => {
    const store = createEventStore(evolve, 0)
    const seen: EventEnvelope<CounterEvent>[] = []
    store.bus.subscribeAll((event) => seen.push(event))
    store.commit([{ type: 'incremented', by: 4 }, { type: 'reset' }], 'tenant-123', 'aggregate-456')
    expect(seen.map((e) => e.event)).toEqual([{ type: 'incremented', by: 4 }, { type: 'reset' }])
    expect(seen.map((e) => e.type)).toEqual(['incremented', 'reset'])
    expect(seen.map((e) => e.tenant_id)).toEqual(['tenant-123', 'tenant-123'])
    expect(seen.map((e) => e.aggregate_id)).toEqual(['aggregate-456', 'aggregate-456'])
  })
})
