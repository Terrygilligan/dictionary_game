/**
 * Adaptive Difficulty Agent Usage Example
 * 
 * Demonstrates how to integrate the AdaptiveDifficultyAgent with the
 * event-sourcing system for real-time difficulty adjustment.
 */

import type { GameEvent } from '@/entities/game'
import type { EventStore } from '@/shared/event-sourcing'
import { createAIIntegration } from '../integration/aiIntegration'
import { createEventStore } from '@/shared/event-sourcing'
import { initialGameState, evolveGame } from '@/entities/game'

/**
 * Example: Setting up adaptive difficulty for a game session
 */
export function setupAdaptiveDifficultyExample(): void {
  console.log('🎮 [EXAMPLE] Setting up Adaptive Difficulty Agent')
  
  // Create event store
  const gameStore = createEventStore(evolveGame, initialGameState)
  
  // Create AI integration
  const aiIntegration = createAIIntegration(gameStore)
  
  // Tenant and aggregate identifiers (representing a specific player and game session)
  const tenant_id = 'player_123'
  const aggregate_id = 'game_session_456'
  
  // Start AI processing for this player's game session
  aiIntegration.startProcessing(tenant_id, aggregate_id)
  
  // Simulate game events
  simulateGameSession(gameStore, tenant_id, aggregate_id)
  
  // Get AI statistics
  const stats = aiIntegration.getAgentManager().getStats()
  console.log('🤖 [AI] Final statistics:', stats)
  
  // Cleanup
  aiIntegration.stopProcessing(tenant_id, aggregate_id)
}

/**
 * Simulate a game session with various performance levels
 */
async function simulateGameSession(
  gameStore: EventStore<any, GameEvent>,
  tenant_id: string,
  aggregate_id: string
): Promise<void> {
  console.log('🎮 [EXAMPLE] Starting simulated game session')
  
  // Start game
  const startEvent = {
    type: 'game/started' as const,
    tenant_id,
    aggregate_id,
    deck: [
      {
        wordId: 'word1',
        term: 'Example',
        partOfSpeech: 'noun',
        choices: [
          { id: 'choice1', text: 'Definition 1', correct: true },
          { id: 'choice2', text: 'Definition 2', correct: false },
          { id: 'choice3', text: 'Definition 3', correct: false },
          { id: 'choice4', text: 'Definition 4', correct: false },
        ]
      },
      {
        wordId: 'word2',
        term: 'Test',
        partOfSpeech: 'verb',
        choices: [
          { id: 'choice1', text: 'Definition 1', correct: true },
          { id: 'choice2', text: 'Definition 2', correct: false },
          { id: 'choice3', text: 'Definition 3', correct: false },
          { id: 'choice4', text: 'Definition 4', correct: false },
        ]
      }
    ]
  }
  
  gameStore.commit([startEvent], tenant_id, aggregate_id)
  
  // Wait a bit for AI processing
  await sleep(100)
  
  // Simulate perfect performance (should increase difficulty)
  console.log('🎮 [EXAMPLE] Simulating perfect performance...')
  for (let i = 0; i < 5; i++) {
    const answerEvent = {
      type: 'answer/submitted' as const,
      tenant_id,
      aggregate_id,
      roundIndex: i,
      choiceId: 'choice1',
      correct: true
    }
    
    const streakEvent = {
      type: 'streak/updated' as const,
      tenant_id,
      aggregate_id,
      streak: i + 1
    }
    
    gameStore.commit([answerEvent, streakEvent], tenant_id, aggregate_id)
    
    // Wait for AI processing
    await sleep(50)
    
    // Check current state
    const state = gameStore.getState(tenant_id, aggregate_id)
    console.log(`🎮 [EXAMPLE] Round ${i + 1}: Difficulty = ${state.currentDifficulty}, Score = ${state.answers.filter((a: any) => a.correct).length}/${state.answers.length}`)
  }
  
  // Simulate struggling performance (should decrease difficulty)
  console.log('🎮 [EXAMPLE] Simulating struggling performance...')
  for (let i = 5; i < 10; i++) {
    const answerEvent = {
      type: 'answer/submitted' as const,
      tenant_id,
      aggregate_id,
      roundIndex: i,
      choiceId: 'choice2',
      correct: false
    }
    
    const streakEvent = {
      type: 'streak/updated' as const,
      tenant_id,
      aggregate_id,
      streak: 0
    }
    
    gameStore.commit([answerEvent, streakEvent], tenant_id, aggregate_id)
    
    // Wait for AI processing
    await sleep(50)
    
    // Check current state
    const state = gameStore.getState(tenant_id, aggregate_id)
    console.log(`🎮 [EXAMPLE] Round ${i + 1}: Difficulty = ${state.currentDifficulty}, Score = ${state.answers.filter((a: any) => a.correct).length}/${state.answers.length}`)
  }
  
  // Finish game
  const finishEvent = {
    type: 'game/finished' as const,
    tenant_id,
    aggregate_id,
    correct: 5,
    total: 10
  }
  
  gameStore.commit([finishEvent], tenant_id, aggregate_id)
  
  // Final state check
  const finalState = gameStore.getState(tenant_id, aggregate_id)
  console.log('🎮 [EXAMPLE] Game finished:', {
    finalDifficulty: finalState.currentDifficulty,
    finalScore: `${finalState.answers.filter((a: any) => a.correct).length}/${finalState.answers.length}`,
    accuracy: `${Math.round((finalState.answers.filter((a: any) => a.correct).length / finalState.answers.length) * 100)}%`
  })
}

/**
 * Simple sleep helper for async simulation
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Example of monitoring AI decisions
 */
export function monitorAIDecisions(): void {
  console.log('🤖 [EXAMPLE] Monitoring AI Decision Process')
  
  // Create event store and AI integration
  const gameStore = createEventStore(evolveGame, initialGameState)
  const aiIntegration = createAIIntegration(gameStore)
  
  const tenant_id = 'player_monitor'
  const aggregate_id = 'game_monitor'
  
  // Start processing
  aiIntegration.startProcessing(tenant_id, aggregate_id)
  
  // Get the adaptive difficulty agent directly
  const agentManager = aiIntegration.getAgentManager()
  const agent = agentManager.getAgent(tenant_id, aggregate_id, 'adaptive-difficulty')
  
  console.log('🤖 [EXAMPLE] Agent info:', {
    id: agent.agentId,
    name: agent.name,
    description: agent.description,
    subscribedEvents: agent.getSubscribedEventTypes()
  })
  
  // Simulate events and monitor AI responses
  simulateAndMonitor(gameStore, agent, tenant_id, aggregate_id)
  
  // Cleanup
  aiIntegration.stopProcessing(tenant_id, aggregate_id)
}

/**
 * Simulate events and monitor AI responses in detail
 */
async function simulateAndMonitor(
  gameStore: EventStore<any, GameEvent>,
  _agent: any,
  tenant_id: string,
  aggregate_id: string
): Promise<void> {
  // Start game
  const startEvent = {
    type: 'game/started' as const,
    tenant_id,
    aggregate_id,
    deck: [
      {
        wordId: 'word1',
        term: 'Monitor',
        partOfSpeech: 'verb',
        choices: [
          { id: 'choice1', text: 'Definition 1', correct: true },
          { id: 'choice2', text: 'Definition 2', correct: false },
        ]
      }
    ]
  }
  
  gameStore.commit([startEvent], tenant_id, aggregate_id)
  await sleep(100)
  
  // Submit correct answer
  const answerEvent = {
    type: 'answer/submitted' as const,
    tenant_id,
    aggregate_id,
    roundIndex: 0,
    choiceId: 'choice1',
    correct: true
  }
  
  const streakEvent = {
    type: 'streak/updated' as const,
    tenant_id,
    aggregate_id,
    streak: 1
  }
  
  console.log('🤖 [EXAMPLE] Submitting events for AI processing...')
  gameStore.commit([answerEvent, streakEvent], tenant_id, aggregate_id)
  
  // Wait for AI processing
  await sleep(200)
  
  // Check final state
  const finalState = gameStore.getState(tenant_id, aggregate_id)
  const eventLog = gameStore.getLog(tenant_id, aggregate_id)
  
  console.log('🤖 [EXAMPLE] Final state:', {
    difficulty: finalState.currentDifficulty,
    score: `${finalState.answers.filter((a: any) => a.correct).length}/${finalState.answers.length}`,
    totalEvents: eventLog.length,
    difficultyAdjustments: eventLog.filter(e => e.event.type === 'difficulty/adjusted').length
  })
  
  // Show difficulty adjustment events if any
  const difficultyEvents = eventLog.filter(e => e.event.type === 'difficulty/adjusted')
  if (difficultyEvents.length > 0) {
    console.log('🤖 [EXAMPLE] Difficulty adjustments made:')
    difficultyEvents.forEach(e => {
      const event = e.event as any
      console.log(`  - ${event.previousLevel} → ${event.newDifficulty} (${event.adjustmentReason})`)
    })
  }
}
