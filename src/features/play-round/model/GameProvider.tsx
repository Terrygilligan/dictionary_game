import { useState, type ReactNode } from 'react'
import { GameStoreContext } from './context.ts'
import { gameStore, type GameStore } from './gameStore.ts'

export interface GameProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to the shared store. */
  store?: GameStore
}

export function GameProvider({ children, store }: GameProviderProps) {
  const [providedGameStore] = useState<GameStore>(() => store ?? gameStore)
  return <GameStoreContext.Provider value={providedGameStore}>{children}</GameStoreContext.Provider>
}
