import { useGameStats } from './useGameStats'

/**
 * Component that contains the actual game stats hooks.
 * This component only mounts after identity is resolved,
 * ensuring a clean hook lifecycle.
 */
export function GameStatsReady() {
  useGameStats()
  return null // This component doesn't render anything
}
