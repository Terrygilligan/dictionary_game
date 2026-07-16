import { useEffect } from 'react';
import { outboxProcessor } from '@/shared/events/OutboxProcessor';
import { emailVerificationService } from '@/services/EmailVerificationService';
import { userProjectionService } from '@/services/userProjectionService';
import { useFirebaseAuth } from '@/features/play-round/model/useFirebaseAuth';

export const OutboxProvider = () => {
  const { isAuthenticated, isLoading: authLoading } = useFirebaseAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated) {
      console.log('📦 [OUTBOX] User authenticated → starting event processors');
      outboxProcessor.start();
      emailVerificationService.start();
      userProjectionService.start();
    } else {
      console.log('🔒 [OUTBOX] User not authenticated → stopping event processors');
      outboxProcessor.stop();
      emailVerificationService.stop();
      userProjectionService.stop();
    }
  }, [isAuthenticated, authLoading]);

  return null;
};
