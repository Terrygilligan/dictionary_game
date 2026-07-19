import type { ReactNode } from 'react'
import { GameProvider } from '@/features/play-round'
import { I18nProvider } from '@/shared/lib/i18n/I18nProvider'
import { NavigationProvider } from '@/shared/lib/navigation'
import { UserProvider } from '@/entities/user'
import { VillageProvider } from '@/entities/village'
import { EmailVerificationTracker } from '@/components/EmailVerificationTracker'
import { UserProjectionProvider } from './UserProjectionProvider'
import { GameAuditProvider } from './GameAuditProvider'
import { VillageAuditProvider } from './VillageAuditProvider'

/** Composition root for cross-cutting providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  console.log('🏗️ [APP_PROVIDERS] Providers rendering')
  
  return (
    <NavigationProvider>
      <I18nProvider>
        <UserProvider>
          <EmailVerificationTracker />
          <UserProjectionProvider />
          <GameAuditProvider />
          <VillageAuditProvider />
          <VillageProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </VillageProvider>
        </UserProvider>
      </I18nProvider>
    </NavigationProvider>
  )
}
