import { useEffect } from 'react';
import { villageAuditService } from '@/services/villageAuditService';
import { useAuthInitialization } from '@/entities/user/model';
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
  const { canOperate } = useAuthInitialization();
  const { user } = useFirebaseAuth();

  useEffect(() => {
    // Guard: Wait for auth initialization AND user object to be fully populated
    const isUserFullyPopulated = user && user.id && user.email;
    
    if (!canOperate || !isUserFullyPopulated) {
      console.log('� [VILLAGE_AUDIT] Auth not ready or user not fully populated → stopping village audit service', {
        canOperate,
        userExists: !!user,
        userId: user?.id,
        hasEmail: !!user?.email
      });
      villageAuditService.stop();
      return;
    }

    console.log('� [VILLAGE_AUDIT] Auth ready and user fully populated → starting village audit service', {
      userId: user.id,
      email: user.email
    });
    villageAuditService.start();
  }, [canOperate, user]);

  return null;
};
