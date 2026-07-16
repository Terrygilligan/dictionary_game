/**
 * Adaptive Difficulty Agent
 * 
 * An autonomous AI agent that monitors player performance in real-time
 * and adjusts game difficulty dynamically. Each tenant (player) gets
 * personalized difficulty adjustments based on their event stream.
 * 
 * Following Event-Driven Architecture Blueprint:
 * - Subscribes to specific event types
 * - Analyzes event stream using RAG context
 * - Emits difficulty adjustment events
 * - Maintains tenant isolation
 */

import type { GameEvent, GameEventType } from '@/entities/game'
import type { AIAgent, EventContext } from '../agent'

/**
 * Difficulty adjustment event emitted by the AdaptiveDifficultyAgent
 */
export interface DifficultyAdjustedEvent {
  readonly type: 'difficulty/adjusted'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly newDifficulty: number
  readonly previousDifficulty: number
  readonly performanceScore: number
  readonly adjustmentReason: string
  readonly timestamp: number
}

/**
 * Performance metrics calculated from event stream
 */
interface PerformanceMetrics {
  /** Overall accuracy percentage (0-100) */
  accuracy: number
  /** Current streak length */
  currentStreak: number
  /** Maximum streak achieved */
  maxStreak: number
  /** Recent performance trend */
  recentTrend: 'improving' | 'declining' | 'stable'
  /** Total rounds analyzed */
  totalRounds: number
  /** Performance score (0-100) used for difficulty decisions */
  performanceScore: number
}

/**
 * Adaptive Difficulty Agent Implementation
 * 
 * Monitors player performance and adjusts game difficulty in real-time.
 * Each tenant gets personalized difficulty adjustments based on their
 * specific event stream and performance patterns.
 */
export class AdaptiveDifficultyAgent implements AIAgent {
  readonly agentId = 'adaptive-difficulty-agent'
  readonly name = 'Adaptive Difficulty Agent'
  readonly description = 'Monitors player performance and adjusts game difficulty dynamically for optimal engagement'
  
  private readonly subscribedEventTypes: Set<GameEventType> = new Set([
    'answer/submitted',
    'streak/updated',
    'game/finished'
  ])
  
  private eventStore: any
  private readonly difficultyThresholds = {
    /** Performance score above which difficulty increases */
    increase: 85,
    /** Performance score below which difficulty decreases */
    decrease: 45,
    /** Minimum difficulty level */
    min: 1,
    /** Maximum difficulty level */
    max: 10
  }
  
  constructor() {
    console.log('🤖 [AI] AdaptiveDifficultyAgent initialized')
  }
  
  /**
   * Subscribe to specific event types for performance monitoring
   */
  subscribe(eventTypes: GameEventType[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.add(type))
    console.log('🤖 [AI] AdaptiveDifficultyAgent subscribed to events:', eventTypes)
  }
  
  /**
   * Unsubscribe from specific event types
   */
  unsubscribe(eventTypes: GameEventType[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.delete(type))
    console.log('🤖 [AI] AdaptiveDifficultyAgent unsubscribed from events:', eventTypes)
  }
  
  /**
   * Get currently subscribed event types
   */
  getSubscribedEventTypes(): readonly GameEventType[] {
    return Array.from(this.subscribedEventTypes)
  }
  
  /**
   * Set the event store for this agent
   */
  setEventStore(eventStore: any): void {
    this.eventStore = eventStore
  }
  
  /**
   * Core decision-making loop - analyzes performance and emits difficulty adjustments
   */
  async process(context: EventContext): Promise<GameEvent[]> {
    const { tenant_id, aggregate_id, eventHistory } = context
    
    console.log(`🤖 [AI] Processing events for tenant: ${tenant_id}, aggregate: ${aggregate_id}`)
    
    // Calculate performance metrics from event history
    const metrics = this.calculatePerformanceMetrics(eventHistory)
    
    console.log(`🤖 [AI] Performance metrics:`, metrics)
    
    // Determine if difficulty adjustment is needed
    const adjustment = this.determineDifficultyAdjustment(metrics)
    
    if (adjustment.shouldAdjust) {
      console.log(`🤖 [AI] Adjusting difficulty: ${adjustment.previousLevel} → ${adjustment.newLevel} (${adjustment.reason})`)
      
      // Emit difficulty adjustment event
      const difficultyEvent: DifficultyAdjustedEvent = {
        type: 'difficulty/adjusted',
        tenant_id,
        aggregate_id,
        newDifficulty: adjustment.newLevel,
        previousDifficulty: adjustment.previousLevel,
        performanceScore: metrics.performanceScore,
        adjustmentReason: adjustment.reason,
        timestamp: Date.now()
      }
      
      return [difficultyEvent as any] // Cast to GameEvent for compatibility
    }
    
    return []
  }
  
  /**
   * Emit events to the event stream
   */
  emit(events: GameEvent[], tenant_id: string, aggregate_id: string): void {
    if (!this.eventStore) {
      throw new Error('EventStore not injected. Call setEventStore() first.')
    }
    
    console.log(`🤖 [AI] Emitting ${events.length} events for tenant: ${tenant_id}`)
    
    // Ensure all events have proper tenant_id and aggregate_id
    const enrichedEvents = events.map(event => ({
      ...event,
      tenant_id,
      aggregate_id
    }))
    
    this.eventStore.commit(enrichedEvents, tenant_id, aggregate_id)
  }
  
  /**
   * Calculate comprehensive performance metrics from event history
   */
  private calculatePerformanceMetrics(eventHistory: readonly any[]): PerformanceMetrics {
    const answerEvents = eventHistory
      .filter(e => e.event.type === 'answer/submitted')
      .map(e => e.event)
    
    const streakEvents = eventHistory
      .filter(e => e.event.type === 'streak/updated')
      .map(e => e.event)
    
    // Calculate accuracy
    const correctAnswers = answerEvents.filter(e => e.correct).length
    const totalAnswers = answerEvents.length
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
    
    // Calculate streak metrics
    const currentStreak = streakEvents.length > 0 
      ? streakEvents[streakEvents.length - 1].streak 
      : 0
    const maxStreak = streakEvents.length > 0 
      ? Math.max(...streakEvents.map(e => e.streak)) 
      : 0
    
    // Calculate recent trend (last 10 answers)
    const recentAnswers = answerEvents.slice(-10)
    const recentAccuracy = recentAnswers.length > 0 
      ? (recentAnswers.filter(e => e.correct).length / recentAnswers.length) * 100 
      : 0
    
    console.debug(`[AdaptiveDifficulty] Recent accuracy: ${recentAccuracy.toFixed(2)}% for ${recentAnswers.length} answers`)
    
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAnswers.length >= 5) {
      const firstHalf = recentAnswers.slice(0, Math.floor(recentAnswers.length / 2))
      const secondHalf = recentAnswers.slice(Math.floor(recentAnswers.length / 2))
      
      const firstHalfAccuracy = (firstHalf.filter(e => e.correct).length / firstHalf.length) * 100
      const secondHalfAccuracy = (secondHalf.filter(e => e.correct).length / secondHalf.length) * 100
      
      if (secondHalfAccuracy > firstHalfAccuracy + 10) {
        recentTrend = 'improving'
      } else if (secondHalfAccuracy < firstHalfAccuracy - 10) {
        recentTrend = 'declining'
      }
    }
    
    // Calculate composite performance score
    const performanceScore = this.calculatePerformanceScore({
      accuracy,
      currentStreak,
      maxStreak,
      recentTrend,
      totalRounds: totalAnswers
    })
    
    return {
      accuracy,
      currentStreak,
      maxStreak,
      recentTrend,
      totalRounds: totalAnswers,
      performanceScore
    }
  }
  
  /**
   * Calculate composite performance score (0-100)
   * Weighted formula considering multiple factors
   */
  private calculatePerformanceScore(metrics: {
    accuracy: number
    currentStreak: number
    maxStreak: number
    recentTrend: 'improving' | 'declining' | 'stable'
    totalRounds: number
  }): number {
    const { accuracy, currentStreak, maxStreak, recentTrend, totalRounds } = metrics
    
    // Base score from accuracy (60% weight)
    let score = accuracy * 0.6
    
    // Streak bonus (20% weight)
    const streakBonus = Math.min((currentStreak / 10) * 100, 100) * 0.2
    score += streakBonus
    
    // Max streak achievement (10% weight)
    const maxStreakBonus = Math.min((maxStreak / 15) * 100, 100) * 0.1
    score += maxStreakBonus
    
    // Trend adjustment (10% weight)
    let trendAdjustment = 0
    switch (recentTrend) {
      case 'improving':
        trendAdjustment = 10
        break
      case 'declining':
        trendAdjustment = -10
        break
      case 'stable':
        trendAdjustment = 0
        break
    }
    score += trendAdjustment * 0.1
    
    // Sample size penalty for low data
    if (totalRounds < 5) {
      score *= 0.8 // Reduce confidence with low sample size
    }
    
    return Math.max(0, Math.min(100, Math.round(score)))
  }
  
  /**
   * Determine if difficulty adjustment is needed and what the new level should be
   */
  private determineDifficultyAdjustment(metrics: PerformanceMetrics): {
    shouldAdjust: boolean
    newLevel: number
    previousLevel: number
    reason: string
  } {
    const { performanceScore, recentTrend, accuracy } = metrics
    const { increase, decrease, min, max } = this.difficultyThresholds
    
    // Default: no adjustment
    let shouldAdjust = false
    let newLevel = 5 // Default difficulty level
    let previousLevel = 5
    let reason = 'No adjustment needed'
    
    // Increase difficulty if performing very well
    if (performanceScore >= increase && recentTrend === 'improving') {
      shouldAdjust = true
      newLevel = Math.min(max, 5 + Math.floor((performanceScore - increase) / 10))
      previousLevel = 5
      reason = `High performance (${performanceScore}%) with improving trend`
    }
    // Decrease difficulty if struggling
    else if (performanceScore <= decrease && recentTrend === 'declining') {
      shouldAdjust = true
      newLevel = Math.max(min, 5 - Math.floor((decrease - performanceScore) / 10))
      previousLevel = 5
      reason = `Low performance (${performanceScore}%) with declining trend`
    }
    // Moderate adjustments for edge cases
    else if (accuracy >= 90 && performanceScore >= 80) {
      shouldAdjust = true
      newLevel = Math.min(max, 6)
      previousLevel = 5
      reason = `High accuracy (${accuracy}%) suggests readiness for challenge`
    }
    else if (accuracy <= 30 && performanceScore <= 40) {
      shouldAdjust = true
      newLevel = Math.max(min, 4)
      previousLevel = 5
      reason = `Low accuracy (${accuracy}%) suggests need for easier content`
    }
    
    return {
      shouldAdjust,
      newLevel,
      previousLevel,
      reason
    }
  }
}

/**
 * Factory function to create and configure the AdaptiveDifficultyAgent
 */
export function createAdaptiveDifficultyAgent(): AdaptiveDifficultyAgent {
  const agent = new AdaptiveDifficultyAgent()
  
  // Subscribe to performance-relevant events
  agent.subscribe(['answer/submitted', 'streak/updated', 'game/finished'])
  
  return agent
}

/**
 * Difficulty adjustment event type for type system
 */
export type AdaptiveDifficultyEvent = DifficultyAdjustedEvent
