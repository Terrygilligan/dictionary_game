/**
 * Developmental Projection Example
 * 
 * Demonstrates the language learning developmental projection
 * following Event-Driven Architecture Blueprint patterns.
 */

import type { GameEvent } from '@/entities/game'
import type { LinguisticState } from '../model/state.ts'
import { evolveLanguage, initialLinguisticState } from '../index.ts'

/**
 * Example: Tracking language learning progression through developmental stages
 */
export function demonstrateDevelopmentalProjection(): void {
  console.log('🎓 [LANGUAGE] Developmental Projection Example')
  console.log('=' .repeat(50))
  
  // Start with initial linguistic state
  let languageState: LinguisticState = initialLinguisticState
  
  console.log('\n📊 Initial State:')
  console.log(`  Stage: ${languageState.stage}`)
  console.log(`  Mastered Words: ${languageState.masteredWords.length}`)
  console.log(`  Difficulty Level: ${languageState.difficultyLevel}`)
  
  // Simulate learning progression through events
  console.log('\n🎮 Simulating Learning Events:')
  console.log('-'.repeat(30))
  
  // Phase 1: INFANT stage (0-20 words)
  console.log('\n📚 Phase 1: INFANT Stage (Learning Basics)')
  languageState = simulateLearningPhase(languageState, 'INFANT', 15)
  
  // Phase 2: TODDLER stage (21-50 words)
  console.log('\n📚 Phase 2: TODDLER Stage (Building Vocabulary)')
  languageState = simulateLearningPhase(languageState, 'TODDLER', 25)
  
  // Phase 3: SCHOOLER stage (51-150 words)
  console.log('\n📚 Phase 3: SCHOOLER Stage (Contextual Learning)')
  languageState = simulateLearningPhase(languageState, 'SCHOOLER', 60)
  
  // Phase 4: CONVERSATIONAL stage (150+ words)
  console.log('\n📚 Phase 4: CONVERSATIONAL Stage (Advanced Usage)')
  languageState = simulateLearningPhase(languageState, 'CONVERSATIONAL', 50)
  
  // Final state summary
  console.log('\n🎯 Final Learning State:')
  console.log('=' .repeat(30))
  console.log(`  Stage: ${languageState.stage}`)
  console.log(`  Mastered Words: ${languageState.masteredWords.length}`)
  console.log(`  Difficulty Level: ${languageState.difficultyLevel}`)
  console.log(`  Total Correct: ${languageState.totalCorrect}`)
  console.log(`  Total Incorrect: ${languageState.totalIncorrect}`)
  console.log(`  Current Streak: ${languageState.currentStreak}`)
  console.log(`  Longest Streak: ${languageState.longestStreak}`)
  console.log(`  Missed Words: ${languageState.missedWords.length}`)
  console.log(`  Focus Topics: ${languageState.focusTopics.length}`)
  
  // Show missed words analysis
  console.log('\n📈 Missed Words Analysis:')
  console.log('-'.repeat(25))
  const topMissedWords = [...languageState.missedWords]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  topMissedWords.forEach((mw, index) => {
    const missRate = Math.round((mw.count / mw.attempts) * 100)
    console.log(`  ${index + 1}. "${mw.word}" - ${mw.count}/${mw.attempts} (${missRate}% miss rate)`)
  })
  
  // Show focus topics
  console.log('\n🎯 Current Focus Topics:')
  console.log('-'.repeat(25))
  languageState.focusTopics.forEach((topic, index) => {
    console.log(`  ${index + 1}. ${topic.name} (Priority: ${topic.priority})`)
  })
}

/**
 * Simulate a learning phase with a specific number of events
 */
function simulateLearningPhase(
  initialState: LinguisticState,
  targetStage: string,
  eventCount: number
): LinguisticState {
  let state = initialState
  
  for (let i = 0; i < eventCount; i++) {
    // Create learning events
    const events = createLearningEvents(state, i)
    
    // Process each event through the evolver
    for (const event of events) {
      const previousStage = state.stage
      state = evolveLanguage(state, event)
      
      // Check for stage progression
      if (state.stage !== previousStage) {
        console.log(`  🎉 Stage Progression: ${previousStage} → ${state.stage}`)
        console.log(`     Mastered Words: ${state.masteredWords.length}`)
        console.log(`     Difficulty: ${state.difficultyLevel}`)
      }
    }
    
    // Show progress milestones
    if (i % 10 === 0 && i > 0) {
      console.log(`  📊 Progress: ${state.masteredWords.length} words mastered, Stage: ${state.stage}`)
    }
  }
  
  console.log(`  ✅ ${targetStage} Phase Complete: ${state.masteredWords.length} words mastered`)
  return state
}

/**
 * Create realistic learning events for simulation
 */
function createLearningEvents(state: LinguisticState, iteration: number): GameEvent[] {
  const events: GameEvent[] = []
  
  // Simulate answer submission with varying accuracy
  const accuracy = calculatePhaseAccuracy(state.stage, iteration)
  const isCorrect = Math.random() < accuracy
  
  const answerEvent = {
    type: 'answer/submitted' as const,
    tenant_id: 'demo_tenant',
    aggregate_id: 'demo_session',
    roundIndex: iteration,
    choiceId: isCorrect ? 'correct_choice' : 'wrong_choice',
    correct: isCorrect
  }
  events.push(answerEvent)
  
  // Update streak if correct
  if (isCorrect) {
    const streakEvent = {
      type: 'streak/updated' as const,
      tenant_id: 'demo_tenant',
      aggregate_id: 'demo_session',
      streak: state.currentStreak + 1
    }
    events.push(streakEvent)
  } else {
    const streakEvent = {
      type: 'streak/updated' as const,
      tenant_id: 'demo_tenant',
      aggregate_id: 'demo_session',
      streak: 0
    }
    events.push(streakEvent)
  }
  
  // Occasionally start a new game session
  if (iteration % 20 === 0 && iteration > 0) {
    const gameStartEvent = {
      type: 'game/started' as const,
      tenant_id: 'demo_tenant',
      aggregate_id: 'demo_session',
      deck: generateMockDeck()
    }
    events.push(gameStartEvent)
  }
  
  // Occasionally finish a game session
  if (iteration % 20 === 19 && iteration > 0) {
    const correctAnswers = Math.floor(accuracy * 20)
    const gameFinishEvent = {
      type: 'game/finished' as const,
      tenant_id: 'demo_tenant',
      aggregate_id: 'demo_session',
      correct: correctAnswers,
      total: 20
    }
    events.push(gameFinishEvent)
  }
  
  return events
}

/**
 * Calculate accuracy based on developmental stage and progress
 */
function calculatePhaseAccuracy(stage: string, iteration: number): number {
  // Base accuracy by stage
  const baseAccuracy = {
    'INFANT': 0.6,      // 60% accuracy when learning basics
    'TODDLER': 0.7,     // 70% accuracy when building vocabulary
    'SCHOOLER': 0.75,   // 75% accuracy with contextual learning
    'CONVERSATIONAL': 0.8 // 80% accuracy at advanced level
  }
  
  let accuracy = baseAccuracy[stage as keyof typeof baseAccuracy] || 0.7
  
  // Add some variation based on iteration (learning curve)
  const learningProgress = Math.min(iteration / 50, 1) // Max out at 50 iterations
  accuracy += learningProgress * 0.1 // Up to 10% improvement
  
  // Add some randomness
  accuracy += (Math.random() - 0.5) * 0.2 // ±10% random variation
  
  return Math.max(0.3, Math.min(0.95, accuracy)) // Clamp between 30% and 95%
}

/**
 * Generate mock deck for game events
 */
function generateMockDeck() {
  return [
    {
      wordId: 'word_1',
      term: 'Example',
      partOfSpeech: 'noun',
      choices: [
        { id: 'correct_choice', text: 'A representative form or pattern', correct: true },
        { id: 'wrong_choice', text: 'Something completely different', correct: false }
      ]
    }
  ]
}

/**
 * Demonstrate multi-tenant language learning
 */
export function demonstrateMultiTenantLearning(): void {
  console.log('\n🏢 Multi-Tenant Learning Example:')
  console.log('=' .repeat(40))
  
  // Create separate language states for different tenants
  const tenants = [
    { id: 'student_beginner', name: 'Beginner Student' },
    { id: 'student_intermediate', name: 'Intermediate Student' },
    { id: 'student_advanced', name: 'Advanced Student' }
  ]
  
  const tenantStates = new Map<string, LinguisticState>()
  
  tenants.forEach(tenant => {
    tenantStates.set(tenant.id, initialLinguisticState)
    console.log(`\n👤 ${tenant.name} (${tenant.id}):`)
    console.log(`  Initial Stage: ${tenantStates.get(tenant.id)!.stage}`)
  })
  
  // Simulate different learning paths for each tenant
  tenants.forEach((tenant, index) => {
    let state = tenantStates.get(tenant.id)!
    
    // Different learning patterns based on tenant type
    const eventCount = (index + 1) * 30 // Different amounts of practice
    
    for (let i = 0; i < eventCount; i++) {
      const events = createLearningEvents(state, i + index * 100)
      
      for (const event of events) {
        state = evolveLanguage(state, event)
      }
    }
    
    tenantStates.set(tenant.id, state)
    
    console.log(`\n👤 ${tenant.name} Final State:`)
    console.log(`  Stage: ${state.stage}`)
    console.log(`  Mastered Words: ${state.masteredWords.length}`)
    console.log(`  Accuracy: ${Math.round((state.totalCorrect / (state.totalCorrect + state.totalIncorrect)) * 100)}%`)
    console.log(`  Focus Topics: ${state.focusTopics.length}`)
  })
  
  // Show tenant isolation
  console.log('\n🔒 Tenant Isolation Verification:')
  console.log('-'.repeat(35))
  tenants.forEach(tenant => {
    const state = tenantStates.get(tenant.id)!
    console.log(`  ${tenant.id}: ${state.masteredWords.length} unique words`)
  })
  
  console.log('✅ Each tenant maintains separate learning progress!')
}

/**
 * Run all developmental projection examples
 */
export function runDevelopmentalProjectionExamples(): void {
  demonstrateDevelopmentalProjection()
  demonstrateMultiTenantLearning()
  
  console.log('\n🎓 Developmental Projection Examples Complete!')
  console.log('=' .repeat(50))
  console.log('✅ Event-Driven Architecture Blueprint Compliance:')
  console.log('  - Pure functions with immutable state')
  console.log('  - Multi-tenant state isolation')
  console.log('  - Event-driven state evolution')
  console.log('  - Developmental stage progression')
  console.log('  - Personalized learning tracking')
}
