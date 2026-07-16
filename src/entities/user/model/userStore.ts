import {
  decideUser,
  evolveUser,
  initialUserState,
  type UserCommand,
  type UserEvent,
  type UserState,
} from './index.ts'
import { createEventStore, type EventStore, type EventStoreOptions } from '@/shared/event-sourcing'

export interface UserStore extends EventStore<UserState, UserEvent> {
  /** Runs a command through the decider and commits any resulting events.
   * Requires explicit tenant_id and aggregate_id for multi-tenant isolation. */
  dispatch(command: UserCommand, tenant_id: string, aggregate_id: string): void
}

/**
 * Wires the pure user domain (decider + evolver) to an event store, yielding a
 * command-driven store: `dispatch(command) -> decide -> commit -> re-derive`.
 */
export function createUserStore(options: EventStoreOptions = {}): UserStore {
  const store = createEventStore<UserState, UserEvent>(evolveUser, initialUserState, options)

  return {
    ...store,
    dispatch(command, tenant_id, aggregate_id) {
      const currentState = store.getState(tenant_id, aggregate_id)
      const events = decideUser(currentState, command)
      store.commit(events, tenant_id, aggregate_id)
    },
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
