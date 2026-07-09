import { useCallback, useContext, useSyncExternalStore } from 'react'
import type { GameCommand, GameState } from '@/entities/game'
import { GameStoreContext } from './context.ts'
import type { GameStore } from './gameStore.ts'

function useGameStore(): GameStore {
  const store = useContext(GameStoreContext)
  if (!store) {
    throw new Error('useGame hooks must be used within a <GameProvider>')
  }
  return store
}

/** Subscribes to the derived game state via the store's event log. */
export function useGameState(): GameState {
  const store = useGameStore()
  // Use default tenant/aggregate for single-player games
  const tenant_id = 'game-tenant'
  const aggregate_id = 'game-session'
  
  return useSyncExternalStore(
    (listener) => store.subscribe(tenant_id, aggregate_id, listener),
    () => store.getState(tenant_id, aggregate_id),
    () => store.getState(tenant_id, aggregate_id)
  )
}

/** Returns a stable command dispatcher bound to the current store. */
export function useGameDispatch(): (command: GameCommand) => void {
  const store = useGameStore()
  return useCallback((command: GameCommand) => store.dispatch(command), [store])
}
