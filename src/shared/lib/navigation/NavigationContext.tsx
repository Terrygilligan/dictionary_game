import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'game' | 'village'

interface NavigationContextType {
  currentPage: Page
  navigate: (page: Page) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Initialize from URL
    const path = window.location.pathname
    if (path === '/' || path === '/landing') return 'landing'
    if (path === '/auth') return 'auth'
    if (path === '/games') return 'games'
    if (path === '/profile') return 'profile'
    if (path === '/game') return 'game'
    if (path === '/village') return 'village'
    return 'landing'
  })

  const navigate = (page: Page) => {
    setCurrentPage(page)
    // Update URL without page reload
    window.history.pushState(null, '', `/${page === 'landing' ? '' : page}`)
  }

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/' || path === '/landing') setCurrentPage('landing')
      else if (path === '/auth') setCurrentPage('auth')
      else if (path === '/games') setCurrentPage('games')
      else if (path === '/profile') setCurrentPage('profile')
      else if (path === '/game') setCurrentPage('game')
      else if (path === '/village') setCurrentPage('village')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <NavigationContext.Provider value={{ currentPage, navigate }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}
