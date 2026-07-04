import { useCallback } from 'react'
import {
  selectCurrentAnswer,
  selectCurrentRound,
  selectIsLastRound,
  selectProgress,
  selectScore,
  selectStreak,
} from '@/entities/game'
import { buildDeck, type DeckOptions } from '../model/deck.ts'
import { useGameDispatch, useGameState } from '../model/useGame.ts'
import { StartPanel } from './StartPanel.tsx'
import { RoundPanel } from './RoundPanel.tsx'
import { ResultPanel } from './ResultPanel.tsx'

export interface GameScreenProps {
  /** Deck configuration for new games (round count, choices, rng...). */
  deckOptions?: DeckOptions
}

export function GameScreen({ deckOptions }: GameScreenProps) {
  const state = useGameState()
  const dispatch = useGameDispatch()

  const startGame = useCallback(() => {
    dispatch({ type: 'startGame', deck: buildDeck(deckOptions) })
  }, [dispatch, deckOptions])

  const submitAnswer = useCallback(
    (choiceId: string) => dispatch({ type: 'submitAnswer', choiceId }),
    [dispatch],
  )

  const nextRound = useCallback(() => dispatch({ type: 'nextRound' }), [dispatch])

  if (state.status === 'idle') {
    return <StartPanel onStart={startGame} />
  }

  if (state.status === 'finished') {
    return (
      <ResultPanel
        score={selectScore(state)}
        total={state.deck.length}
        onPlayAgain={startGame}
      />
    )
  }

  const round = selectCurrentRound(state)
  if (!round) return null

  return (
    <RoundPanel
      round={round}
      answer={selectCurrentAnswer(state)}
      progress={selectProgress(state)}
      score={selectScore(state)}
      streak={selectStreak(state)}
      isLastRound={selectIsLastRound(state)}
      onSelect={submitAnswer}
      onNext={nextRound}
    />
  )
}
