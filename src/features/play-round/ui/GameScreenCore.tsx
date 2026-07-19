import { useCallback, useEffect, useState } from 'react'
import {
  selectCurrentAnswer,
  selectCurrentRound,
  selectIsLastRound,
  selectProgress,
  selectScore,
  selectStreak,
} from '@/entities/game'
import { buildDeck, preFetchLexicon, type DeckOptions } from '../model/deck.ts'
import { useGameDispatch, useGameState } from '../model/useGame.ts'
import { StartPanel } from './StartPanel.tsx'
import { RoundPanel } from './RoundPanel.tsx'
import { ResultPanel } from './ResultPanel.tsx'

export interface GameScreenCoreProps {
  tenant_id: string
  aggregate_id: string
  /** Deck configuration for new games (round count, choices, rng...). */
  deckOptions?: DeckOptions
  /** Language for the game (defaults to 'en'). */
  language?: string
  /** Reset game state when navigating away from game page */
  resetOnUnmount?: boolean
}

export function GameScreenCore({ 
  tenant_id, 
  aggregate_id, 
  deckOptions, 
  language = 'en', 
  resetOnUnmount = false 
}: GameScreenCoreProps) {
  // UNCONDITIONAL HOOKS - Always called in the same order
  const state = useGameState(tenant_id, aggregate_id)
  const dispatch = useGameDispatch()
  const [isLoadingDeck, setIsLoadingDeck] = useState(false)

  // Reset game state when navigating away
  useEffect(() => {
    return () => {
      if (resetOnUnmount && state.status !== 'idle') {
        console.log('🔄 [GAME] Auto-resetting game state on unmount')
        dispatch({ type: 'resetGame', reason: 'navigation-change', tenant_id, aggregate_id })
      }
    }
  }, [dispatch, resetOnUnmount, state.status, tenant_id, aggregate_id])

  // Pre-fetch lexicon data when component mounts or language changes
  // This ensures data is ready before user clicks "Play", making UI feel snappier
  useEffect(() => {
    console.log(`🔄 [GAME] Pre-fetching lexicon data for language "${language}"`)
    preFetchLexicon(language)
  }, [language])

  const startGame = useCallback(async () => {
    console.log(`🎮 GameScreen.startGame: Starting game with language "${language}"`)
    console.log(`🎮 GameScreen.startGame: Deck options:`, { ...deckOptions, language })
    setIsLoadingDeck(true)
    try {
      const deck = await buildDeck({ ...deckOptions, language })
      console.log(`🎮 GameScreen.startGame: Built deck with ${deck.length} rounds`)
      dispatch({ type: 'startGame', deck, tenant_id, aggregate_id })
    } catch (error) {
      console.error('❌ [GAME] Failed to build deck:', error)
    } finally {
      setIsLoadingDeck(false)
    }
  }, [dispatch, deckOptions, language, tenant_id, aggregate_id])

  const submitAnswer = useCallback(
    (choiceId: string) => dispatch({ type: 'submitAnswer', choiceId, tenant_id, aggregate_id }),
    [dispatch, tenant_id, aggregate_id],
  )

  const nextRound = useCallback(() => dispatch({ type: 'nextRound', tenant_id, aggregate_id }), [dispatch, tenant_id, aggregate_id])

  
  // CONDITIONAL RENDERING - No hooks involved
  if (state.status === 'idle') {
    return <StartPanel onStart={startGame} isLoading={isLoadingDeck} />
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
