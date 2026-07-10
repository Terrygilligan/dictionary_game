import type { UserEvent, BaseUserEvent } from '@/entities/user/model/events.ts'
import type { GameEvent, BaseGameEvent } from '@/entities/game/model/events.ts'

/**
 * Test configuration for event factory
 */
interface TestEventConfig {
  tenant_id?: string
  aggregate_id?: string
}

/**
 * Default test configuration
 */
const DEFAULT_TEST_CONFIG: TestEventConfig = {
  tenant_id: 'test-tenant',
  aggregate_id: 'test-user-id'
}

/**
 * Creates a test event with proper tenant_id and aggregate_id compliance
 * 
 * @param config - Optional configuration overrides
 * @returns Factory function that creates compliant test events
 */
export function createTestEventFactory(config: TestEventConfig = {}) {
  const finalConfig = { ...DEFAULT_TEST_CONFIG, ...config }

  return {
    /**
     * Creates a compliant user test event
     * @param baseEvent - Event object without tenant_id and aggregate_id
     * @returns Complete event with identity metadata
     */
    user<T extends Omit<UserEvent, 'tenant_id' | 'aggregate_id'>>(baseEvent: T): T & BaseUserEvent {
      return {
        ...baseEvent,
        tenant_id: finalConfig.tenant_id!,
        aggregate_id: finalConfig.aggregate_id!
      } as T & BaseUserEvent
    },

    /**
     * Creates a compliant game test event
     * @param baseEvent - Event object without tenant_id and aggregate_id
     * @returns Complete event with identity metadata
     */
    game<T extends Omit<GameEvent, 'tenant_id' | 'aggregate_id'>>(baseEvent: T): T & BaseGameEvent {
      return {
        ...baseEvent,
        tenant_id: finalConfig.tenant_id!,
        aggregate_id: finalConfig.aggregate_id!
      } as T & BaseGameEvent
    },

    /**
     * Creates a test event with custom aggregate_id (useful for user-specific tests)
     * @param userId - Custom aggregate_id (typically user ID)
     * @returns Factory function with custom aggregate_id
     */
    forUser(userId: string) {
      return createTestEventFactory({
        ...finalConfig,
        aggregate_id: userId
      })
    },

    /**
     * Creates a test event with custom tenant_id
     * @param tenantId - Custom tenant_id
     * @returns Factory function with custom tenant_id
     */
    forTenant(tenantId: string) {
      return createTestEventFactory({
        ...finalConfig,
        tenant_id: tenantId
      })
    }
  }
}

/**
 * Default event factory instance for general use
 */
export const createTestEvent = createTestEventFactory()

/**
 * Convenience function for creating user-specific test events
 * @param userId - User ID to use as aggregate_id
 * @returns Factory function scoped to specific user
 */
export function createTestEventForUser(userId: string) {
  return createTestEvent.forUser(userId)
}

/**
 * Convenience function for creating tenant-specific test events
 * @param tenantId - Tenant ID to use as tenant_id
 * @returns Factory function scoped to specific tenant
 */
export function createTestEventForTenant(tenantId: string) {
  return createTestEvent.forTenant(tenantId)
}
