import { useCallback, useEffect } from 'react'
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
  /** Language for the game (defaults to 'en'). */
  language?: string
  /** Reset game state when navigating away from game page */
  resetOnUnmount?: boolean
}

export function GameScreen({ deckOptions, language = 'en', resetOnUnmount = false }: GameScreenProps) {
  const state = useGameState()
  const dispatch = useGameDispatch()

  // Reset game state when navigating away
  useEffect(() => {
    return () => {
      if (resetOnUnmount && state.status !== 'idle') {
        console.log('🔄 [GAME] Auto-resetting game state on unmount')
        dispatch({ type: 'resetGame', reason: 'navigation-change' })
      }
    }
  }, [dispatch, resetOnUnmount, state.status])

  const startGame = useCallback(() => {
    console.log(`🎮 GameScreen.startGame: Starting game with language "${language}"`)
    console.log(`🎮 GameScreen.startGame: Deck options:`, { ...deckOptions, language })
    const deck = buildDeck({ ...deckOptions, language })
    console.log(`🎮 GameScreen.startGame: Built deck with ${deck.length} rounds`)
    dispatch({ type: 'startGame', deck })
  }, [dispatch, deckOptions, language])

  const submitAnswer = useCallback(
    (choiceId: string) => dispatch({ type: 'submitAnswer', choiceId }),
    [dispatch],
  )

  const nextRound = useCallback(() => dispatch({ type: 'nextRound' }), [dispatch])

  const resetGame = useCallback(() => {
    console.log('🔄 [GAME] Resetting game state')
    dispatch({ type: 'resetGame', reason: 'manual-reset' })
  }, [dispatch])

  
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
