import { GameScreenIdentity } from './GameScreenIdentity'
import { GameScreenCore } from './GameScreenCore'

export interface GameScreenProps {
  /** Deck configuration for new games (round count, choices, rng...). */
  deckOptions?: import('../model/deck.ts').DeckOptions
  /** Language for the game (defaults to 'en'). */
  language?: string
  /** Reset game state when navigating away from game page */
  resetOnUnmount?: boolean
}

export function GameScreen({ deckOptions, language = 'en', resetOnUnmount = false }: GameScreenProps) {
  return (
    <GameScreenIdentity>
      {(tenant_id, aggregate_id) => (
        <GameScreenCore
          tenant_id={tenant_id}
          aggregate_id={aggregate_id}
          deckOptions={deckOptions}
          language={language}
          resetOnUnmount={resetOnUnmount}
        />
      )}
    </GameScreenIdentity>
  )
}
