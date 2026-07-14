import { useCallback, useContext, useState, useEffect } from 'react'
import type { GameCommand, GameState } from '@/entities/game'
import { GameStoreContext } from './context.ts'
import type { GameStore } from './gameStore.ts'

export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext)
  if (!store) {
    throw new Error('useGame hooks must be used within a <GameProvider>')
  }
  return store
}

/**
 * Subscribes to the derived game state via the store's event log.
 * 
 * Architectural Compliance: Requires explicit tenant_id and aggregate_id
 * to ensure subscription identity matches dispatch identity exactly.
 * Prevents context drift and maintains multi-tenant isolation.
 * 
 * Hook Stability: Uses useState + useEffect to prevent prevDeps crashes
 * during component mounting phases by decoupling from useSyncExternalStore.
 */
export function useGameState(tenant_id: string | null, aggregate_id: string | null): GameState {
  const store = useGameStore()
  
  // Initialize with safe default state
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    deck: [],
    currentRound: 0,
    answers: [],
    streak: 0,
    currentLanguage: 'en',
    currentDifficulty: 5,
  })
  
  // Only perform subscription logic when identity is guaranteed
  useEffect(() => {
    // Early return if identity is missing
    if (!tenant_id || !tenant_id.trim()) {
      return
    }
    
    if (!aggregate_id || !aggregate_id.trim()) {
      return
    }
    
    // Get initial state from store
    const initialState = store.getState(tenant_id, aggregate_id)
    setGameState(initialState)
    
    // Subscribe to store updates
    const unsubscribe = store.subscribe(tenant_id, aggregate_id, () => {
      const newState = store.getState(tenant_id, aggregate_id)
      setGameState(newState)
    })
    
    // Cleanup subscription on unmount or identity change
    return unsubscribe
  }, [store, tenant_id, aggregate_id])
  
  return gameState
}

/**
 * Returns a stable command dispatcher bound to the current store.
 * 
 * The dispatcher itself doesn't need identity parameters - the commands
 * carry their own identity metadata as required by the Command Identity Directive.
 */
export function useGameDispatch(): (command: GameCommand) => void {
  const store = useGameStore()
  return useCallback((command: GameCommand) => store.dispatch(command), [store])
}
