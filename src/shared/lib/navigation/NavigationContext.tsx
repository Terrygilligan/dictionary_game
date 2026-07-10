import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'

export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'game' | 'village' | 'admin'

interface NavigationContextType {
  currentPage: Page
  navigate: (page: Page) => void
  isNavigating: boolean
}

const NavigationContext = createContext<NavigationContextType>({
  currentPage: 'landing',
  navigate: () => console.warn('Navigation not initialized'),
  isNavigating: false,
})

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Initialize from URL with fallback
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

  // Debug: Track NavigationProvider mounts and state changes
  useEffect(() => {
    console.log('🧭 [NAVIGATION] Provider mounted/updated:', { currentPage, isNavigating })
  }, [currentPage, isNavigating])


  const navigate = (page: Page) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Emit NAV_START event immediately
    if (page !== currentPage) {
      setIsNavigating(true)
      
      // Dispatch custom event for global listeners
      window.dispatchEvent(new CustomEvent('NAV_START', { 
        detail: { from: currentPage, to: page } 
      }))
    }

    // Debounce navigation to prevent rapid successive changes
    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(page)
      // Update URL without page reload
      window.history.pushState(null, '', `/${page === 'landing' ? '' : page}`)
      
      // Emit NAV_COMPLETE after page change and URL update
      window.dispatchEvent(new CustomEvent('NAV_COMPLETE', { 
        detail: { from: currentPage, to: page } 
      }))
      
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

  const contextValue = { currentPage, navigate, isNavigating }
  
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  
  // Removed diagnostic logs for cleaner console
  if (!context) {
    console.error('Navigation context is null - check provider hierarchy')
  }
  
  return context // Default context ensures this never returns undefined
}
