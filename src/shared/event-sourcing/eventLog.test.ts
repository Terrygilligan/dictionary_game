import { afterEach, describe, expect, it, vi } from 'vitest'
import { createEventLogService, eventLogFromJSON, replayLog } from './eventLog.ts'
import { resetIdFactory, setIdFactory } from '../lib/id.ts'
import type { EventLog } from './eventLog.ts'

type CounterEvent = { type: 'incremented'; by: number } | { type: 'reset' }

const evolve = (state: number, event: CounterEvent): number =>
  event.type === 'incremented' ? state + event.by : 0

afterEach(() => {
  resetIdFactory()
  vi.restoreAllMocks()
})

describe('EventLogService', () => {
  it('opens a log with matchId and createdAt', () => {
    const clock = { now: () => 1234 }
    const service = createEventLogService<number, CounterEvent>('match-1', { clock })
    const log = service.getLog()
    expect(log.matchId).toBe('match-1')
    expect(log.createdAt).toBe(1234)
    expect(log.events).toEqual([])
  })

  it('appends events with monotonic seq and stamped metadata', () => {
    let n = 0
    setIdFactory(() => `ev-${(n += 1)}`)
    const clock = { now: () => 1000 }
    const service = createEventLogService<number, CounterEvent>('m', { clock })

    service.append([{ type: 'incremented', by: 2 }])
    service.append([{ type: 'incremented', by: 3 }, { type: 'reset' }])

    const { events } = service.getLog()
    expect(events.map((e) => e.seq)).toEqual([0, 1, 2])
    expect(events.map((e) => e.id)).toEqual(['ev-1', 'ev-2', 'ev-3'])
    expect(events.every((e) => e.timestamp === 1000)).toBe(true)
  })

  it('ignores an empty append', () => {
    const service = createEventLogService<number, CounterEvent>('m')
    expect(service.append([])).toEqual([])
    expect(service.getLog().events).toHaveLength(0)
  })

  it('replays the log to reconstruct state (pure fold)', () => {
    const service = createEventLogService<number, CounterEvent>('m')
    service.append([{ type: 'incremented', by: 2 }, { type: 'incremented', by: 3 }])
    service.append([{ type: 'reset' }, { type: 'incremented', by: 7 }])
    expect(service.replay(evolve, 0)).toBe(7)
    // Pure: replaying again yields the same result.
    expect(service.replay(evolve, 0)).toBe(7)
  })

  it('mirrors offline: live -> JSON -> parse -> replay reproduces state', () => {
    const service = createEventLogService<number, CounterEvent>('match-42')
    service.append([{ type: 'incremented', by: 5 }, { type: 'incremented', by: 4 }])
    const live = service.replay(evolve, 0)

    const json = service.toJSON()
    const restored = eventLogFromJSON<CounterEvent>(json)

    expect(restored.matchId).toBe('match-42')
    expect(restored.events).toHaveLength(2)
    expect(replayLog(evolve, 0, restored)).toBe(live)
  })

  it('resumes from an existing log and continues the seq', () => {
    const existing: EventLog<CounterEvent> = {
      matchId: 'm',
      createdAt: 1,
      events: [{ id: 'a', seq: 0, timestamp: 1, event: { type: 'incremented', by: 1 } }],
    }
    const service = createEventLogService<number, CounterEvent>('m', { initialLog: existing })
    service.append([{ type: 'incremented', by: 1 }])
    expect(service.getLog().events.map((e) => e.seq)).toEqual([0, 1])
    expect(service.replay(evolve, 0)).toBe(2)
  })

  it('rejects malformed JSON', () => {
    expect(() => eventLogFromJSON('{"matchId":"m"}')).toThrow(/malformed/i)
    expect(() => eventLogFromJSON(JSON.stringify({ matchId: 'm', createdAt: 1, events: [{}] }))).toThrow(
      /malformed/i,
    )
  })
})
