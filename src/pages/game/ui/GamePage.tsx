import { GameScreen } from '@/features/play-round'

export function GamePage() {
  return (
    <main className="page">
      <header className="page__masthead">
        <h1 className="page__title">Lexicon Master</h1>
        <p className="page__tagline">Match every word to its meaning.</p>
      </header>
      <GameScreen />
    </main>
  )
}
