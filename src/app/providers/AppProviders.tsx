import type { ReactNode } from 'react'
import { GameProvider } from '@/features/play-round'

/** Composition root for cross-cutting providers. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <GameProvider>{children}</GameProvider>
}
