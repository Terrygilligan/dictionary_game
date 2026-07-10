import { GameStatsLoadingSkeleton } from '@/features/play-round/ui/GameStatsLoadingSkeleton'
import { useIdentityReady } from '@/features/play-round/model/useIdentityReady'
import { GameContent } from './GameContent'

interface GamePageProps {
  isGuest?: boolean
}

export function GamePage({ isGuest = false }: GamePageProps) {
  const { isReady } = useIdentityReady()

  // Top-Level Guard: GameContent only enters the render tree when isReady is true
  if (!isReady) {
    return <GameStatsLoadingSkeleton />
  }

  // GameContent only mounts once identity is already true
  return <GameContent isGuest={isGuest} />
}
