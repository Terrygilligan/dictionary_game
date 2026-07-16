import { useEffect } from 'react';
import { villageAuditService } from '@/services/villageAuditService';
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth';

/**
 * Village Audit Provider
 *
 * Manages the lifecycle of the village audit service based on authentication state.
 * Ensures audit logging only occurs when user identity is established.
 *
 * Architectural Compliance:
 * - Auth-Aware: Only starts when user is authenticated
 * - Lifecycle Management: Proper start/stop on auth state changes
 * - Multi-Tenant: Respects Firebase auth context for identity
 * - Provider Pattern: Follows established provider conventions
 */
export const VillageAuditProvider = () => {
  const { isAuthenticated, isLoading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    // Wait for auth state to resolve
    if (authLoading) {
      return;
    }

    // Start audit service when user is authenticated
    if (isAuthenticated) {
      console.log('🔐 [VILLAGE_AUDIT] User authenticated → starting village audit service');
      villageAuditService.start();
    } else {
      console.log('🔒 [VILLAGE_AUDIT] User not authenticated → stopping village audit service');
      villageAuditService.stop();
    }
  }, [isAuthenticated, authLoading]);

  return null;
};
