import { describe, expect, it, vi } from 'vitest'
import { createEventBus } from './eventBus.ts'

type Msg = { type: 'ping'; n: number } | { type: 'pong' }

describe('createEventBus', () => {
  it('delivers events only to matching channel subscribers', () => {
    const bus = createEventBus<Msg>()
    const onPing = vi.fn()
    const onPong = vi.fn()
    bus.subscribe('ping', onPing)
    bus.subscribe('pong', onPong)

    bus.publish({ type: 'ping', n: 1 })
    expect(onPing).toHaveBeenCalledWith({ type: 'ping', n: 1 })
    expect(onPong).not.toHaveBeenCalled()
  })

  it('delivers every event to wildcard subscribers', () => {
    const bus = createEventBus<Msg>()
    const all: Msg[] = []
    bus.subscribeAll((e) => all.push(e))
    bus.publish({ type: 'ping', n: 1 })
    bus.publish({ type: 'pong' })
    expect(all).toEqual([{ type: 'ping', n: 1 }, { type: 'pong' }])
  })

  it('stops delivering after unsubscribe', () => {
    const bus = createEventBus<Msg>()
    const listener = vi.fn()
    const off = bus.subscribe('pong', listener)
    off()
    bus.publish({ type: 'pong' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('is not disrupted by a listener unsubscribing mid-dispatch', () => {
    const bus = createEventBus<Msg>()
    const order: string[] = []
    const off = bus.subscribe('pong', () => {
      order.push('a')
      off()
    })
    bus.subscribe('pong', () => order.push('b'))
    bus.publish({ type: 'pong' })
    expect(order).toEqual(['a', 'b'])
  })
})
