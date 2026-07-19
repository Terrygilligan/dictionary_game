import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('NAVIGATION')

export type Page = 'landing' | 'auth' | 'games' | 'game' | 'profile' | 'village' | 'admin'

interface NavigationContextType {
  currentPage: Page
  navigate: (page: Page) => void
  isNavigating: boolean
}

const NavigationContext = createContext<NavigationContextType>({
  currentPage: 'landing',
  navigate: () => { logger.warn('Navigation not initialized') },
  isNavigating: false,
})

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Initialize from URL with fallback
    const path = window.location.pathname

    logger.log('Initializing from URL:', path)

    if (path === '/' || path === '/landing') {
      logger.log('Mapped to: landing')
      return 'landing'
    }
    if (path === '/auth') {
      logger.log('Mapped to: auth')
      return 'auth'
    }
    if (path === '/games' || path === '/game') {
      logger.log('Mapped to: games')
      return 'games'
    }
    if (path === '/profile') {
      logger.log('Mapped to: profile')
      return 'profile'
    }
    if (path === '/village') {
      logger.log('Mapped to: village')
      return 'village'
    }
    if (path === '/admin') {
      logger.log('Mapped to: admin')
      return 'admin'
    }

    logger.log('Unknown path, defaulting to: landing')
    return 'landing'
  })

  const [isNavigating, setIsNavigating] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debug: Track NavigationProvider mounts and state changes
  useEffect(() => {
    logger.log('Provider mounted/updated:', { currentPage, isNavigating })
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
      logger.log('Executing navigation to:', page)
      setCurrentPage(page)
      // Update URL without page reload
      const urlPath = page === 'landing' ? '' : page
      window.history.pushState(null, '', `/${urlPath}`)
      logger.log('URL updated to:', `/${urlPath}`)
      
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
      logger.log('PopState event, path:', path)
      if (path === '/' || path === '/landing') {
        logger.log('PopState mapping to: landing')
        setCurrentPage('landing')
      }
      else if (path === '/auth') {
        logger.log('PopState mapping to: auth')
        setCurrentPage('auth')
      }
      else if (path === '/games' || path === '/game') {
        logger.log('PopState mapping to: games')
        setCurrentPage('games')
      }
      else if (path === '/profile') {
        logger.log('PopState mapping to: profile')
        setCurrentPage('profile')
      }
      else if (path === '/village') {
        logger.log('PopState mapping to: village')
        setCurrentPage('village')
      }
      else if (path === '/admin') {
        logger.log('PopState mapping to: admin')
        setCurrentPage('admin')
      } else {
        logger.log('PopState unknown path, defaulting to: landing')
        setCurrentPage('landing')
      }
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
    logger.error('Navigation context is null - check provider hierarchy')
  }

  return context // Default context ensures this never returns undefined
}
