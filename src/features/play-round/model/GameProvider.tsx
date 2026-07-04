import { useState, type ReactNode } from 'react'
import { GameStoreContext } from './context.ts'
import { createGameStore, type GameStore } from './gameStore.ts'

export interface GameProviderProps {
  children: ReactNode
  /** Inject a pre-built store (used in tests). Defaults to a fresh store. */
  store?: GameStore
}

export function GameProvider({ children, store }: GameProviderProps) {
  const [gameStore] = useState<GameStore>(() => store ?? createGameStore())
  return <GameStoreContext.Provider value={gameStore}>{children}</GameStoreContext.Provider>
}
