import { useEffect } from 'react';
import { gameAuditService } from '@/services/gameAuditService';
import { useAuthInitialization } from '@/entities/user/model';
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth';

/**
 * Game Audit Provider
 * 
 * Manages the lifecycle of the game audit service based on authentication state.
 * Ensures audit logging only occurs when user identity is established.
 * 
 * Architectural Compliance:
 * - Auth-Aware: Only starts when user is authenticated
 * - Lifecycle Management: Proper start/stop on auth state changes
 * - Multi-Tenant: Respects Firebase auth context for identity
 * - Provider Pattern: Follows established provider conventions
 */
export const GameAuditProvider = () => {
  const { canOperate } = useAuthInitialization();
  const { user } = useFirebaseAuth();

  useEffect(() => {
    // Guard: Wait for auth initialization AND user object to be fully populated
    const isUserFullyPopulated = user && user.id && user.email;
    
    if (!canOperate || !isUserFullyPopulated) {
      console.log('� [GAME_AUDIT] Auth not ready or user not fully populated → stopping game audit service', {
        canOperate,
        userExists: !!user,
        userId: user?.id,
        hasEmail: !!user?.email
      });
      gameAuditService.stop();
      return;
    }

    console.log('� [GAME_AUDIT] Auth ready and user fully populated → starting game audit service', {
        userId: user.id,
        email: user.email
      });
    gameAuditService.start();
  }, [canOperate, user]);

  return null;
};
