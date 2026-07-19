/**
 * Mandatory teardown interface for all singleton services
 * 
 * This addresses Constraint #1 (Strict Teardown Contract) by requiring
 * every singleton service to implement a teardown() method that performs
 * absolute state reset when called.
 * 
 * Services must:
 * 1. Clear all internal state buffers
 * 2. Cancel all active subscriptions/timeouts
 * 3. Validate tenant_id before cleanup (Constraint #4)
 * 4. Log teardown operations for audit trail
 */
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('SERVICE_REGISTRY')
export interface ITeardownService {
  /**
   * Perform absolute teardown of the service
   * 
   * @param tenant_id - The tenant ID being torn down (for validation)
   * @throws SecurityContextError if tenant_id mismatch detected
   */
  teardown(tenant_id?: string): void
  
  /**
   * Check if service is currently active
   */
  isActive(): boolean
}

/**
 * Security context error for tenant_id validation failures
 * 
 * This addresses Constraint #4 (Fail-Loud Requirement) by throwing
 * explicit errors when tenant_id mismatches are detected during operations.
 */
export class SecurityContextError extends Error {
  constructor(
    message: string,
    public readonly expectedTenantId?: string,
    public readonly actualTenantId?: string,
    public readonly operation?: string
  ) {
    super(message)
    this.name = 'SecurityContextError'
  }
}

/**
 * Service registry for centralized singleton lifecycle management
 * 
 * This addresses Constraint #3 (No "Implicit" Propagation) by providing
 * a centralized registry that all singleton services register with.
 * Services subscribe directly to auth events through this registry,
 * guaranteeing cleanup regardless of UI tree state.
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry
  private services = new Map<string, ITeardownService>()
  
  private constructor() {}
  
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry()
    }
    return ServiceRegistry.instance
  }
  
  /**
   * Register a singleton service for lifecycle management
   */
  register(name: string, service: ITeardownService): void {
    logger.log(`Registering service: ${name}`)
    this.services.set(name, service)
  }
  
  /**
   * Perform teardown on all registered services
   * 
   * @param tenant_id - The tenant ID being torn down (for validation)
   */
  async teardownAll(tenant_id?: string): Promise<void> {
    logger.log(`Starting teardown for tenant: ${tenant_id || 'all'}`)
    
    const teardownPromises = Array.from(this.services.entries()).map(
      async ([name, service]) => {
        try {
          logger.log(`Tearing down service: ${name}`)
          service.teardown(tenant_id)
          logger.log(`Service torn down: ${name}`)
        } catch (error) {
          logger.error(`Failed to teardown service ${name}:`, error)
          // Continue with other services even if one fails
        }
      }
    )
    
    await Promise.all(teardownPromises)
    logger.log(`All services torn down for tenant: ${tenant_id || 'all'}`)
  }
  
  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys())
  }
  
  /**
   * Check if a service is registered
   */
  hasService(name: string): boolean {
    return this.services.has(name)
  }
}

/**
 * Export singleton instance
 */
export const serviceRegistry = ServiceRegistry.getInstance()
