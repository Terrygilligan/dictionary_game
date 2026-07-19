/**
 * Tenant Configuration
 * 
 * This module provides tenant identification for multi-tenant isolation.
 * Currently uses a default community tenant until dynamic tenant resolution is implemented.
 * 
 * ARCHITECTURAL NOTE: tenant_id represents the community/organization scope,
 * NOT individual user identity (uid). These must remain separate.
 */

export const DEFAULT_TENANT_ID = 'lexicon_community_main'

/**
 * Get the tenant ID for the current context.
 * 
 * @returns The tenant ID string
 */
export function getTenantId(): string {
  return DEFAULT_TENANT_ID
}
