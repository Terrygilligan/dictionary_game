/**
 * Language Learning Evolver
 * 
 * Pure function that evolves LinguisticState based on GameEvent.
 * Following Event-Driven Architecture Blueprint with immutable state patterns.
 * 
 * This evolver processes game events to track language learning progress,
 * manage developmental stages, and maintain learning analytics.
 */

import type { LinguisticState, MissedWord, FocusTopic } from './state.ts'
import type { GameEvent } from '@/entities/game'
import { 
  determineDevelopmentalStage,
  isReadyForStageProgression,
  getNextStage,
  STAGE_THRESHOLDS
} from './state.ts'

/**
 * Language Learning Evolver
 * 
 * Pure fold function: (state, event) -> nextState
 * 
 * This function maintains strict functional programming principles:
 * - No side effects
 * - No mutation of input state
 * - Deterministic output for given inputs
 * - Event-driven state evolution
 * 
 * Following Event-Driven Architecture Blueprint:
 * - Single source of truth: event log
 * - Immutable state projections
 * - Tenant-specific state evolution
 */
export function evolveLanguage(state: LinguisticState, event: GameEvent): LinguisticState {
  switch (event.type) {
    case 'answer/submitted':
      return handleAnswerSubmitted(state, event)
    
    case 'game/started':
      return handleGameStarted(state, event)
    
    case 'game/finished':
      return handleGameFinished(state, event)
    
    case 'streak/updated':
      return handleStreakUpdated(state, event)
    
    case 'language/changed':
      return handleLanguageChanged(state, event)
    
    case 'difficulty/adjusted':
      return handleDifficultyAdjusted(state, event)
    
    default:
      // Events not relevant to language learning projection
      return state
  }
}

/**
 * Handle answer submission events
 * 
 * This is the core logic for tracking language learning progress:
 * - Add correct answers to mastered words
 * - Track missed words for targeted practice
 * - Update learning analytics
 * - Check for developmental stage progression
 */
function handleAnswerSubmitted(state: LinguisticState, event: Extract<GameEvent, { type: 'answer/submitted' }>): LinguisticState {
  const { correct, roundIndex } = event
  
  // Extract word from round context (would need to be passed in event or looked up)
  // For now, we'll simulate word extraction from roundIndex
  const word = extractWordFromRoundIndex(roundIndex)
  
  if (correct) {
    return handleCorrectAnswer(state, word)
  } else {
    return handleIncorrectAnswer(state, word)
  }
}

/**
 * Handle correct answer submission
 * 
 * Logic for correct answers:
 * - Add word to masteredWords if not present
 * - Update streak and accuracy metrics
 * - Check for developmental stage progression
 * - Update last activity timestamp
 */
function handleCorrectAnswer(state: LinguisticState, word: string): LinguisticState {
  // Add word to mastered words if not already present
  const masteredWords = state.masteredWords.includes(word)
    ? state.masteredWords
    : [...state.masteredWords, word]
  
  // Remove word from missed words if it was previously missed
  const missedWords = state.missedWords.filter(mw => mw.word !== word)
  
  // Update streak and accuracy metrics
  const newCurrentStreak = state.currentStreak + 1
  const newLongestStreak = Math.max(state.longestStreak, newCurrentStreak)
  const newTotalCorrect = state.totalCorrect + 1
  
  // Create new state
  let newState: LinguisticState = {
    ...state,
    masteredWords,
    missedWords,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    totalCorrect: newTotalCorrect,
    lastActivity: Date.now()
  }
  
  // Check for developmental stage progression
  newState = checkStageProgression(newState)
  
  // Update difficulty level based on new stage
  newState = updateDifficultyLevel(newState)
  
  return newState
}

/**
 * Handle incorrect answer submission
 * 
 * Logic for incorrect answers:
 * - Increment miss count for the word
 * - Reset current streak
 * - Update accuracy metrics
 * - Track learning patterns
 */
function handleIncorrectAnswer(state: LinguisticState, word: string): LinguisticState {
  // Find existing missed word entry
  const existingMissedWord = state.missedWords.find(mw => mw.word === word)
  
  let updatedMissedWords: MissedWord[]
  
  if (existingMissedWord) {
    // Update existing missed word entry
    updatedMissedWords = state.missedWords.map(mw => 
      mw.word === word
        ? {
            ...mw,
            count: mw.count + 1,
            attempts: mw.attempts + 1,
            lastMissed: Date.now()
          }
        : mw
    )
  } else {
    // Create new missed word entry
    const newMissedWord: MissedWord = {
      word,
      count: 1,
      attempts: 1,
      lastMissed: Date.now()
    }
    updatedMissedWords = [...state.missedWords, newMissedWord]
  }
  
  return {
    ...state,
    missedWords: updatedMissedWords,
    currentStreak: 0, // Reset streak on incorrect answer
    totalIncorrect: state.totalIncorrect + 1,
    lastActivity: Date.now()
  }
}

/**
 * Check and handle developmental stage progression
 * 
 * Logic for stage progression:
 * - Evaluate if learner meets requirements for next stage
 * - Update stage if ready
 * - Trigger stage transition events (if needed)
 */
function checkStageProgression(state: LinguisticState): LinguisticState {
  if (!isReadyForStageProgression(state)) {
    return state
  }
  
  const nextStage = getNextStage(state.stage)
  if (!nextStage) {
    return state // Already at maximum stage
  }
  
  console.log(`🎓 [LANGUAGE] Stage progression: ${state.stage} → ${nextStage}`)
  console.log(`📊 [LANGUAGE] Mastered words: ${state.masteredWords.length}`)
  
  return {
    ...state,
    stage: nextStage
  }
}

/**
 * Update difficulty level based on developmental stage and performance
 * 
 * Logic for difficulty adjustment:
 * - Base difficulty on developmental stage
 * - Fine-tune based on recent performance
 * - Keep within stage-appropriate range
 */
function updateDifficultyLevel(state: LinguisticState): LinguisticState {
  const stageThreshold = STAGE_THRESHOLDS[state.stage]
  const [minDifficulty, maxDifficulty] = stageThreshold.difficultyRange
  
  // Calculate accuracy rate
  const totalAttempts = state.totalCorrect + state.totalIncorrect
  const accuracy = totalAttempts > 0 ? (state.totalCorrect / totalAttempts) * 100 : 0
  
  // Base difficulty on stage
  let newDifficulty = Math.floor((minDifficulty + maxDifficulty) / 2)
  
  // Adjust based on accuracy
  if (accuracy >= 85) {
    newDifficulty = Math.min(maxDifficulty, newDifficulty + 1)
  } else if (accuracy <= 45) {
    newDifficulty = Math.max(minDifficulty, newDifficulty - 1)
  }
  
  // Only update if different
  if (newDifficulty === state.difficultyLevel) {
    return state
  }
  
  console.log(`🎯 [LANGUAGE] Difficulty adjusted: ${state.difficultyLevel} → ${newDifficulty} (accuracy: ${Math.round(accuracy)}%)`)
  
  return {
    ...state,
    difficultyLevel: newDifficulty
  }
}

/**
 * Handle game started events
 * 
 * Logic for game session initialization:
 * - Increment sessions completed
 * - Reset current streak if starting fresh
 * - Update focus topics based on missed words
 */
function handleGameStarted(state: LinguisticState, _event: Extract<GameEvent, { type: 'game/started' }>): LinguisticState {
  // Update focus topics based on missed words
  const updatedFocusTopics = updateFocusTopics(state)
  
  return {
    ...state,
    sessionsCompleted: state.sessionsCompleted + 1,
    focusTopics: updatedFocusTopics,
    lastActivity: Date.now()
  }
}

/**
 * Handle game finished events
 * 
 * Logic for game session completion:
 * - Update learning analytics
 * - Prepare recommendations for next session
 * - Update long-term learning patterns
 */
function handleGameFinished(state: LinguisticState, event: Extract<GameEvent, { type: 'game/finished' }>): LinguisticState {
  const { correct, total } = event
  const sessionAccuracy = total > 0 ? (correct / total) * 100 : 0
  
  console.log(`🏁 [LANGUAGE] Game finished: ${correct}/${total} (${Math.round(sessionAccuracy)}%)`)
  
  return {
    ...state,
    lastActivity: Date.now()
  }
}

/**
 * Handle streak updated events
 * 
 * Logic for streak management:
 * - Update current streak from game events
 * - Maintain longest streak record
 */
function handleStreakUpdated(state: LinguisticState, event: Extract<GameEvent, { type: 'streak/updated' }>): LinguisticState {
  const { streak } = event
  const newLongestStreak = Math.max(state.longestStreak, streak)
  
  return {
    ...state,
    currentStreak: streak,
    longestStreak: newLongestStreak,
    lastActivity: Date.now()
  }
}

/**
 * Handle language changed events
 * 
 * Logic for language switching:
 * - Update target language
 * - Reset language-specific progress
 * - Maintain cross-language analytics
 */
function handleLanguageChanged(state: LinguisticState, event: Extract<GameEvent, { type: 'language/changed' }>): LinguisticState {
  const { language } = event
  
  console.log(`🌐 [LANGUAGE] Language changed: ${state.targetLanguage} → ${language}`)
  
  return {
    ...state,
    targetLanguage: language,
    lastActivity: Date.now()
  }
}

/**
 * Handle difficulty adjusted events
 * 
 * Logic for external difficulty adjustments:
 * - Update difficulty level from AI agents
 * - Log adjustment reasoning
 * - Maintain adjustment history
 */
function handleDifficultyAdjusted(state: LinguisticState, event: Extract<GameEvent, { type: 'difficulty/adjusted' }>): LinguisticState {
  const { newDifficulty, performanceScore, adjustmentReason } = event
  
  console.log(`🤖 [LANGUAGE] AI difficulty adjustment: ${state.difficultyLevel} → ${newDifficulty}`)
  console.log(`📊 [LANGUAGE] Performance score: ${performanceScore}%`)
  console.log(`💡 [LANGUAGE] Reason: ${adjustmentReason}`)
  
  return {
    ...state,
    difficultyLevel: newDifficulty,
    lastActivity: Date.now()
  }
}

/**
 * Update focus topics based on missed words and learning patterns
 * 
 * Logic for focus topic management:
 * - Identify high-priority missed words
 * - Group words by topic categories
 * - Prioritize based on miss rate and recency
 */
function updateFocusTopics(state: LinguisticState): FocusTopic[] {
  // For now, create simple focus topics from most missed words
  // In a real implementation, this would use word categorization
  const mostMissedWords = state.missedWords
    .filter(mw => mw.count >= 2) // Words missed at least twice
    .sort((a, b) => b.count - a.count) // Most missed first
    .slice(0, 5) // Top 5 missed words
  
  return mostMissedWords.map((mw, index) => ({
    id: `focus_${mw.word}`,
    name: `Practice: ${mw.word}`,
    priority: 5 - index, // Higher priority for most missed
    lastPracticed: mw.lastMissed
  }))
}

/**
 * Extract word from round index
 * 
 * In a real implementation, this would look up the word
 * from the game state or event context. For now, we'll
 * simulate word extraction.
 * 
 * @param roundIndex - The round index to extract word from
 * @returns The word associated with this round
 */
function extractWordFromRoundIndex(roundIndex: number): string {
  // Simulated word extraction - in reality, this would come from game data
  const simulatedWords = [
    'apple', 'book', 'cat', 'dog', 'elephant',
    'flower', 'garden', 'house', 'ice', 'jump',
    'kite', 'lion', 'moon', 'night', 'ocean',
    'park', 'queen', 'river', 'sun', 'tree',
    'umbrella', 'violin', 'water', 'xylophone', 'yellow'
  ]
  
  return simulatedWords[roundIndex % simulatedWords.length] || 'unknown'
}

/**
 * Validate evolved state integrity
 * 
 * Ensures the evolved state maintains consistency and follows
 * the invariants defined in the state model
 */
export function validateEvolvedState(state: LinguisticState): boolean {
  // Check mastered words are unique
  const uniqueMasteredWords = new Set(state.masteredWords)
  if (uniqueMasteredWords.size !== state.masteredWords.length) {
    console.error('❌ [LANGUAGE] Duplicate mastered words detected')
    return false
  }
  
  // Check missed words have valid counts
  for (const missed of state.missedWords) {
    if (missed.count < 0 || missed.count > missed.attempts) {
      console.error('❌ [LANGUAGE] Invalid missed word counts:', missed)
      return false
    }
  }
  
  // Check developmental stage matches mastered words
  const expectedStage = determineDevelopmentalStage(state.masteredWords.length)
  if (state.stage !== expectedStage) {
    console.warn('⚠️ [LANGUAGE] Stage mismatch detected:', {
      current: state.stage,
      expected: expectedStage,
      masteredWords: state.masteredWords.length
    })
  }
  
  // Check difficulty is within stage range
  const stageRange = STAGE_THRESHOLDS[state.stage].difficultyRange
  if (state.difficultyLevel < stageRange[0] || state.difficultyLevel > stageRange[1]) {
    console.warn('⚠️ [LANGUAGE] Difficulty outside stage range:', {
      difficulty: state.difficultyLevel,
      stage: state.stage,
      range: stageRange
    })
  }
  
  return true
}
