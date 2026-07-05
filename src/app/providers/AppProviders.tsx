import type { ReactNode } from 'react'
import { GameProvider } from '@/features/play-round'
import { I18nProvider } from '@/shared/lib/i18n/I18nProvider'
import { NavigationProvider } from '@/shared/lib/navigation'
import { Header } from '@/shared/ui/Header'

/** Composition root for cross-cutting providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <I18nProvider>
        <GameProvider>
          <div className="app">
            <Header />
            <main className="app__main">
              {children}
            </main>
          </div>
        </GameProvider>
      </I18nProvider>
    </NavigationProvider>
  )
}
