import { createEventStore, type EventStore, type EventStoreOptions } from '@/shared/event-sourcing'
import { decideVillage, evolveVillage, initialVillageState, type VillageCommand, type VillageEvent, type VillageState } from './index'
import { villageEventBus, createVillageEventEnvelope } from './VillageEventBus'

export interface VillageStore extends EventStore<VillageState, VillageEvent> {
  /** Runs a command through the decider and commits any resulting events. */
  dispatch(command: VillageCommand): void
}

/**
 * Wires the pure domain (decider + evolver) to an event store.
 * ENFORCES strict command identity compliance - no fallbacks allowed.
 */
export function createVillageStore(options: EventStoreOptions = {}): VillageStore {
  const store = createEventStore<VillageState, VillageEvent>(evolveVillage, initialVillageState, options)

  return {
    ...store,
    dispatch(command) {
      // STRICT ENFORCEMENT: No fallbacks, no enhancement
      if (!command.tenant_id || !command.tenant_id.trim()) {
        throw new Error('COMMAND_IDENTITY_VIOLATION: Missing mandatory tenant_id')
      }

      if (!command.aggregate_id || !command.aggregate_id.trim()) {
        throw new Error('COMMAND_IDENTITY_VIOLATION: Missing mandatory aggregate_id')
      }

      console.log(`🏘️ [VILLAGE_STORE] Dispatching command:`, command.type, { 
        tenant_id: command.tenant_id, 
        aggregate_id: command.aggregate_id,
        command: command
      })
      
      // Pure domain processing - command used exactly as received
      const currentState = store.getState(command.tenant_id, command.aggregate_id)
      const context = { timestamp: Date.now() }
      const events = decideVillage(currentState, command, context)
      console.log(`🏘️ [VILLAGE_STORE] Generated events:`, events.length, events)
      
      store.commit(events, command.tenant_id, command.aggregate_id)

      // Publish events to VillageEventBus for audit trail and projections
      events.forEach(event => {
        const correlationId = crypto.randomUUID()
        const envelope = createVillageEventEnvelope(
          command.tenant_id,
          command.aggregate_id,
          correlationId,
          event
        )
        villageEventBus.publish(envelope)
        console.log(`🏘️ [VILLAGE_STORE] Published event to VillageEventBus:`, event.type, { correlationId })
      })
      
      console.log(`🏘️ [VILLAGE_STORE] New state updated for tenant:`, command.tenant_id)
    },
  }
}

/** Shared application village store. */
export const villageStore = createVillageStore()
