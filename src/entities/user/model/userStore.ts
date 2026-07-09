import {
  decideUser,
  evolveUser,
  initialUserState,
  type UserCommand,
  type UserEvent,
  type UserState,
} from './index.ts'
import { createEventStore, type EventStore, type EventStoreOptions } from '@/shared/event-sourcing'
import type { EventEnvelope } from '@/shared/event-sourcing'

export interface UserStore extends EventStore<UserState, UserEvent> {
  /** Runs a command through the decider and commits any resulting events. */
  dispatch(command: UserCommand): void
  /** Resets the store to initial state without creating a new instance */
  resetState(): void
}

/**
 * Wires the pure user domain (decider + evolver) to an event store, yielding a
 * command-driven store: `dispatch(command) -> decide -> commit -> re-derive`.
 */
export function createUserStore(options: EventStoreOptions = {}): UserStore {
  const store = createEventStore<UserState, UserEvent>(evolveUser, initialUserState, options)
  
  // Internal references to allow reset
  let logRef: readonly EventEnvelope<UserEvent>[] = []
  let stateRef: UserState = initialUserState
  const listeners = new Set<() => void>()

  // Override the store methods to track internal state
  const originalCommit = store.commit.bind(store)
  const originalSubscribe = store.subscribe.bind(store)
  const originalGetState = store.getState.bind(store)
  const originalGetLog = store.getLog.bind(store)

  store.commit = (events) => {
    const result = originalCommit(events)
    logRef = originalGetLog()
    stateRef = originalGetState()
    return result
  }

  store.subscribe = (listener) => {
    listeners.add(listener)
    return originalSubscribe(listener)
  }

  return {
    ...store,
    dispatch(command) {
      store.commit(decideUser(store.getState(), command))
    },
    resetState() {
      console.log('🔄 [USER_STORE] Resetting store state to initial')
      // Clear internal state by setting to initial values
      logRef = []
      stateRef = initialUserState
      
      // Notify all subscribers of the state change
      for (const listener of [...listeners]) listener()
    },
    // Override getState to return our tracked state
    getState: () => stateRef,
    // Override getLog to return our tracked log  
    getLog: () => logRef,
  }
}

/**
 * Create and export user store instance
 */
export const userStore = createUserStore()

/**
 * Export user store type for dependency injection
 */
export type { UserStore as IUserStore }
