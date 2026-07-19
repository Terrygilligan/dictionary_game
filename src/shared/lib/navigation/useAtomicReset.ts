import { useEffect, useRef } from 'react'
import { useNavigation } from './NavigationContext'
import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('ATOMIC_RESET')

export interface ResetFunction {
  (): void
}

const resetRegistry = new Set<ResetFunction>()

/**
 * Register a cleanup function to be called when navigation starts
 */
export function registerResetFunction(fn: ResetFunction) {
  resetRegistry.add(fn)
  return () => {
    resetRegistry.delete(fn)
  } // Return cleanup function
}

/**
 * Hook that subscribes to NAV_START events and executes all registered cleanup functions
 */
export function useAtomicReset() {
  const { currentPage } = useNavigation()
  const previousPageRef = useRef(currentPage)
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    // Detect navigation start
    if (currentPage !== previousPageRef.current && !isNavigatingRef.current) {
      logger.log('NAV_START detected - executing cleanup')
      isNavigatingRef.current = true

      // Execute all registered cleanup functions
      resetRegistry.forEach(fn => {
        try {
          fn()
        } catch (error) {
          logger.error('Cleanup function failed:', error)
        }
      })

      // Reset navigation flag after cleanup
      const timeout = setTimeout(() => {
        isNavigatingRef.current = false
        previousPageRef.current = currentPage
      }, 100) // Give enough time for cleanup to complete

      return () => clearTimeout(timeout)
    }
  }, [currentPage])

  return {
    registerReset: registerResetFunction
  }
}

/**
 * Hook for components to register their own cleanup on navigation
 */
export function useNavigationCleanup(cleanupFn: ResetFunction) {
  const { registerReset } = useAtomicReset()

  useEffect(() => {
    const unregister = registerReset(cleanupFn)
    return unregister
  }, [registerReset, cleanupFn])
}
