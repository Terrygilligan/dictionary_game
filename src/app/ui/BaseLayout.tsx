import { type ReactNode, useEffect, useState } from 'react'
import { Header } from '@/shared/ui/Header'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { useNavigation } from '@/shared/lib/navigation'
import { Button } from '@/shared/ui/Button'

interface BaseLayoutProps {
  children: ReactNode
  isAuthenticated: boolean
}

export function BaseLayout({ children, isAuthenticated }: BaseLayoutProps) {
  const { currentPage, navigate } = useNavigation()
  const [renderKey, setRenderKey] = useState(0)
  
  // Layout locking: Ensure layout state matches navigation context
  const navigationCurrentPage = currentPage
  
  // Listen for NAV_COMPLETE to force layout re-render
  useEffect(() => {
    const handleNavComplete = () => {
      console.log('🔄 [LAYOUT] NAV_COMPLETE received - forcing layout re-render')
      setRenderKey(prev => prev + 1)
    }

    window.addEventListener('NAV_COMPLETE', handleNavComplete)
    return () => window.removeEventListener('NAV_COMPLETE', handleNavComplete)
  }, [])
  
  // Synchronization check - prevent mismatched layout shell rendering
  if (!navigationCurrentPage) {
    console.error('� [LAYOUT] SYNC GUARD - No currentPage from navigation context')
    return null
  }

  if (isAuthenticated) {
    // Authenticated layout with full navigation
    return (
      <div className="app" key={renderKey}>
        <Header isAuthenticated={true} />
        <main className="app__main">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Public layout for guests - minimal header with navigation
  return (
    <div className="app" key={renderKey}>
      <header className="app__header app__header--public">
        <div className="app__branding">
          <h1 className="app__title">Lexicon Master</h1>
        </div>
        <div className="app__nav">
          <Button 
            variant={currentPage === 'landing' ? 'primary' : 'ghost'}
            onClick={() => navigate('landing')}
          >
            Home
          </Button>
          <Button 
            variant={currentPage === 'game' ? 'primary' : 'ghost'}
            onClick={() => navigate('game')}
          >
            Play
          </Button>
          <Button 
            variant={currentPage === 'village' ? 'primary' : 'ghost'}
            onClick={() => navigate('village')}
          >
            Village
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('auth')}
          >
            Sign In
          </Button>
        </div>
        <LanguageSwitcher className="app__language-switcher" />
      </header>
      <main className="app__main">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  )
}
