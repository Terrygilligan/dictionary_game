import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'game' | 'village' | 'admin'

interface NavigationContextType {
  currentPage: Page
  navigate: (page: Page) => void
  isNavigating: boolean
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
    if (path === '/admin') return 'admin'
    return 'landing'
  })

  const [isNavigating, setIsNavigating] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debug: Log page changes
  useEffect(() => {
    console.log(`📄 [NAV] Page changed to: ${currentPage}`)
  }, [currentPage])

  const navigate = (page: Page) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Emit NAV_START event immediately
    if (page !== currentPage) {
      console.log(`🚀 [NAV] NAV_START emitted: ${currentPage} → ${page}`)
      setIsNavigating(true)
      
      // Dispatch custom event for global listeners
      window.dispatchEvent(new CustomEvent('NAV_START', { 
        detail: { from: currentPage, to: page } 
      }))
    }

    // Debounce navigation to prevent rapid successive changes
    debounceTimerRef.current = setTimeout(() => {
      console.log(`🧭 [NAV] Navigate called: ${currentPage} → ${page}`)
      setCurrentPage(page)
      // Update URL without page reload
      window.history.pushState(null, '', `/${page === 'landing' ? '' : page}`)
      console.log(`🧭 [NAV] Navigation complete: ${page}`)
      
      // Emit NAV_COMPLETE after page change and URL update
      window.dispatchEvent(new CustomEvent('NAV_COMPLETE', { 
        detail: { from: currentPage, to: page } 
      }))
      console.log(`🎯 [NAV] NAV_COMPLETE emitted: ${currentPage} → ${page}`)
      
      // Reset navigation state after transition
      setTimeout(() => {
        setIsNavigating(false)
      }, 100)
    }, 50) // 50ms debounce
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
      else if (path === '/admin') setCurrentPage('admin')
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Cleanup debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <NavigationContext.Provider value={{ currentPage, navigate, isNavigating }}>
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
