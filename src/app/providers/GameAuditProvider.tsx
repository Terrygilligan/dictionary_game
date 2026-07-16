import { useEffect } from 'react';
import { gameAuditService } from '@/services/gameAuditService';
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
  const { isAuthenticated, isLoading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    // Wait for auth state to resolve
    if (authLoading) {
      return;
    }

    // Start audit service when user is authenticated
    if (isAuthenticated) {
      console.log('📦 [GAME_AUDIT] User authenticated → starting game audit service');
      gameAuditService.start();
    } else {
      console.log('🔒 [GAME_AUDIT] User not authenticated → stopping game audit service');
      gameAuditService.stop();
    }
  }, [isAuthenticated, authLoading]);

  return null;
};
