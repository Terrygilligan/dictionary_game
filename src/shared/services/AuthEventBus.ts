import { createEventBus } from '../event-bus'

/**
 * Auth state event types
 */
export type AuthEventType = 'auth/sign_in' | 'auth/sign_out' | 'auth/initialized'

/**
 * Auth state event payload
 */
export interface AuthEventPayload {
  tenant_id?: string
  aggregate_id?: string
  userId?: string
  timestamp: number
}

/**
 * Auth event envelope
 */
export interface AuthEvent {
  type: AuthEventType
  payload: AuthEventPayload
}

/**
 * Auth Event Bus interface
 * 
 * This addresses Constraint #3 (No "Implicit" Propagation) by providing
 * a centralized event bus that services can subscribe to directly.
 * Services receive auth state changes regardless of UI tree state,
 * guaranteeing cleanup even if components unmount improperly.
 */
export interface IAuthEventBus {
  publish(event: AuthEvent): void
  subscribe(eventType: AuthEventType, listener: (event: AuthEvent) => void): () => void
  subscribeAll(listener: (event: AuthEvent) => void): () => void
}

/**
 * Create Auth Event Bus
 */
export function createAuthEventBus(): IAuthEventBus {
  const bus = createEventBus<AuthEvent>()
  
  return {
    publish(event: AuthEvent): void {
      bus.publish(event)
    },
    
    subscribe(eventType: AuthEventType, listener: (event: AuthEvent) => void): () => void {
      return bus.subscribe(eventType, listener)
    },
    
    subscribeAll(listener: (event: AuthEvent) => void): () => void {
      return bus.subscribeAll(listener)
    }
  }
}

/**
 * Singleton Auth Event Bus instance
 * 
 * This is the centralized bus for auth state changes.
 * Services subscribe to this bus to receive logout events.
 */
export const authEventBus = createAuthEventBus()

/**
 * Helper functions for publishing auth events
 */
export const publishAuthSignIn = (tenant_id: string, aggregate_id: string, userId: string): void => {
  authEventBus.publish({
    type: 'auth/sign_in',
    payload: {
      tenant_id,
      aggregate_id,
      userId,
      timestamp: Date.now()
    }
  })
}

export const publishAuthSignOut = (): void => {
  authEventBus.publish({
    type: 'auth/sign_out',
    payload: {
      timestamp: Date.now()
    }
  })
}

export const publishAuthInitialized = (): void => {
  authEventBus.publish({
    type: 'auth/initialized',
    payload: {
      timestamp: Date.now()
    }
  })
}
