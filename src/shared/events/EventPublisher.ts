/**
 * Event Publisher Interface
 * 
 * Defines the contract for publishing events in an event-driven architecture.
 * This interface enables decoupling of event production from event consumption,
 * allowing different implementations (console, Pub/Sub, etc.) to be swapped
 * without changing the business logic.
 */

export interface IEventPublisher {
  /**
   * Publish an event to a specific topic
   * 
   * @param topic - The event topic/channel (e.g., 'user.registered', 'user.email.verified')
   * @param event - The event payload to publish
   * @returns Promise that resolves when the event is published
   */
  publish<T>(topic: string, event: T): Promise<void>
}

/**
 * Base event structure with correlation tracking
 * All events should include these fields for proper tracing and audit
 */
export interface BaseEvent {
  /** Correlation ID from the original command that triggered this event */
  readonly correlationId: string
  
  /** ISO timestamp when the event was published */
  readonly timestamp: string
  
  /** Event type/topic for routing */
  readonly eventType: string
}

/**
 * User Registration Event
 * Published when a user successfully completes registration
 */
export interface UserRegisteredEvent extends BaseEvent {
  readonly eventType: 'user.registered'
  readonly payload: {
    readonly userId: string
    readonly email: string
    readonly displayName: string
    readonly emailVerified: boolean
    readonly createdAt: number
  }
}

/**
 * User Authentication Event
 * Published when a user successfully signs in
 */
export interface UserAuthenticatedEvent extends BaseEvent {
  readonly eventType: 'user.authenticated'
  readonly payload: {
    readonly userId: string
    readonly email: string
    readonly timestamp: number
  }
}

/**
 * User Email Verification Event
 * Published when a user's email is verified
 */
export interface UserEmailVerifiedEvent extends BaseEvent {
  readonly eventType: 'user.email.verified'
  readonly payload: {
    readonly userId: string
    readonly email: string
    readonly verifiedAt: number
  }
}

/**
 * Union type for all user-related events
 */
export type UserEvent = 
  | UserRegisteredEvent
  | UserAuthenticatedEvent
  | UserEmailVerifiedEvent

/**
 * Event Publishing Result
 * Used for tracking publishing success/failure
 */
export interface EventPublishResult {
  readonly success: boolean
  readonly topic: string
  readonly correlationId: string
  readonly timestamp: string
  readonly error?: string
}
