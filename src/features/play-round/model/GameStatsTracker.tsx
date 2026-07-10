import { useIdentityReady } from './useIdentityReady'
import { GameStatsReady } from './GameStatsReady'

/**
 * Wrapper component that performs the isReady check.
 * This component does NOT contain any hooks itself,
 * ensuring a stable hook lifecycle in the parent.
 */
export function GameStatsTracker() {
  const { isReady } = useIdentityReady()
  
  // Only render the component with hooks when identity is ready
  if (!isReady) {
    return null
  }
  
  return <GameStatsReady />
}
