import { useGameStats } from './useGameStats'

/**
 * Component that tracks game stats and updates user data.
 * This should be rendered within the UserProvider context.
 */
export function GameStatsTracker() {
  useGameStats()
  return null // This component doesn't render anything
}
