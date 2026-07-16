import { type ReactNode, useEffect } from 'react'
import { Header } from '@/shared/ui/Header'
import { useNavigation } from '@/shared/lib/navigation'

interface BaseLayoutProps {
  children: ReactNode
  isAuthenticated: boolean
}

export function BaseLayout({ children, isAuthenticated }: BaseLayoutProps) {
  const { currentPage } = useNavigation()
  
  // Debug: Track BaseLayout renders to identify duplication
  useEffect(() => {
    console.log('🏗️ [BASELAYOUT] Render triggered:', { currentPage, isAuthenticated })
    
    return () => {
      console.log('[BASE_LAYOUT] Unmounting.')
    }
  }, [currentPage, isAuthenticated])

  // Allow layout to render while navigation context initializes
  if (!currentPage) {
    console.log('⌛ [LAYOUT] Initializing navigation...')
  }

  // Unified Layout - Always render the Header component (single source of truth)
  // Removed renderKey to prevent forced re-renders that could cause duplication
  return (
    <div className="app">
      <Header isAuthenticated={isAuthenticated} />
      <main className="app__main">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  )
}
