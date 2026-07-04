import { createContext } from 'react'
import type { GameStore } from './gameStore.ts'

export const GameStoreContext = createContext<GameStore | null>(null)
