import { type ReactNode } from 'react'
import { Header } from '@/shared/ui/Header'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'

interface BaseLayoutProps {
  children: ReactNode
  isAuthenticated: boolean
}

export function BaseLayout({ children, isAuthenticated }: BaseLayoutProps) {
  if (isAuthenticated) {
    // Authenticated layout with full navigation
    return (
      <div className="app">
        <Header isAuthenticated={true} />
        <main className="app__main">
          {children}
        </main>
      </div>
    )
  }

  // Public layout for guests - minimal header
  return (
    <div className="app">
      <header className="app__header app__header--public">
        <div className="app__branding">
          <h1 className="app__title">Lexicon Master</h1>
        </div>
        <LanguageSwitcher className="app__language-switcher" />
      </header>
      <main className="app__main">
        {children}
      </main>
    </div>
  )
}
