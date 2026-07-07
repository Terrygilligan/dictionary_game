import type { ReactNode } from 'react'
import { GameProvider } from '@/features/play-round'
import { I18nProvider } from '@/shared/lib/i18n/I18nProvider'
import { NavigationProvider } from '@/shared/lib/navigation'
import { Header } from '@/shared/ui/Header'
import { UserProvider } from '@/entities/user'
import { GameStatsTracker } from '@/features/play-round/model/GameStatsTracker'
import { EmailVerificationTracker } from '@/components/EmailVerificationTracker'

/** Composition root for cross-cutting providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <I18nProvider>
        <UserProvider>
          <EmailVerificationTracker />
          <GameProvider>
            <GameStatsTracker />
            <div className="app">
              <Header />
              <main className="app__main">
                {children}
              </main>
            </div>
          </GameProvider>
        </UserProvider>
      </I18nProvider>
    </NavigationProvider>
  )
}
