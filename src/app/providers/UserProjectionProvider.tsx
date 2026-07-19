import { useEffect, useRef } from 'react';
import { UserProjectionService } from '@/services/userProjectionService';
import { useAuthInitialization } from '@/entities/user/model';
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('USER_PROJECTION_PROVIDER');

export const UserProjectionProvider = () => {
  const { canOperate } = useAuthInitialization();
  const { user } = useFirebaseAuth();

  // Use ref to track service instance for cleanup
  const userProjectionServiceRef = useRef<UserProjectionService | null>(null);

  useEffect(() => {
    // Guard: Wait for auth initialization AND user object to be fully populated
    // User must have essential properties indicating auth token is ready
    const isUserFullyPopulated = user && user.id && user.email;

    if (!canOperate || !isUserFullyPopulated) {
      logger.log('Auth not ready or user not fully populated → destroying user projection service instance', {
        canOperate,
        userExists: !!user,
        userId: user?.id,
        hasEmail: !!user?.email
      });

      // Destroy service instance
      if (userProjectionServiceRef.current) {
        userProjectionServiceRef.current.stop();
        userProjectionServiceRef.current = null;
      }
      return;
    }

    // Create fresh instance with clean state
    logger.log('Auth ready and user fully populated → creating fresh user projection service instance', {
      userId: user.id,
      email: user.email,
      tenantId: user.id
    });

    // Destroy any existing instance first
    if (userProjectionServiceRef.current) {
      userProjectionServiceRef.current.stop();
    }

    // Create fresh instance
    userProjectionServiceRef.current = new UserProjectionService();

    // Start instance
    userProjectionServiceRef.current.start();

    // Cleanup function - destroy instance when component unmounts or auth state changes
    return () => {
      logger.log('Cleaning up user projection service instance');
      if (userProjectionServiceRef.current) {
        userProjectionServiceRef.current.stop();
        userProjectionServiceRef.current = null;
      }
    };
  }, [canOperate, user]);

  return null;
};
