/**
 * AI Agent Framework for Event-Driven Architecture
 * Following the Event-Driven Architecture Blueprint for AI-Ready Integration
 */

import type { GameEvent, GameEventType } from '@/entities/game'
import type { EventEnvelope } from '@/shared/event-sourcing'

/**
 * Context provided to AI agents for decision-making
 */
export interface EventContext {
  /** Current tenant identifier */
  tenant_id: string
  /** Current aggregate identifier */
  aggregate_id: string
  /** Full event history for the tenant/aggregate */
  eventHistory: readonly EventEnvelope<GameEvent>[]
  /** Current timestamp for decision-making */
  timestamp: number
  /** Additional context data */
  metadata?: Record<string, any>
}

/**
 * AI Agent interface for participating in the event stream
 * AI agents are first-class citizens that can subscribe to events and emit new events
 */
export interface AIAgent<TEvent extends GameEvent = GameEvent> {
  /** Unique identifier for this agent instance */
  readonly agentId: string
  /** Human-readable name for the agent */
  readonly name: string
  /** Description of the agent's purpose and capabilities */
  readonly description: string
  
  /**
   * Subscribe to specific event types
   * @param eventTypes - Array of event types to subscribe to
   */
  subscribe(eventTypes: string[]): void
  
  /**
   * Unsubscribe from specific event types
   * @param eventTypes - Array of event types to unsubscribe from
   */
  unsubscribe(eventTypes: string[]): void
  
  /**
   * Process incoming events and potentially emit new events
   * This is the core decision-making loop for the AI agent
   * @param context - Event context including history and metadata
   * @returns Array of events to emit (may be empty)
   */
  process(context: EventContext): TEvent[]
  
  /**
   * Emit events to the event stream
   * @param events - Events to emit
   * @param tenant_id - Target tenant identifier
   * @param aggregate_id - Target aggregate identifier
   */
  emit(events: TEvent[], tenant_id: string, aggregate_id: string): void
  
  /**
   * Get the current event types this agent is subscribed to
   */
  getSubscribedEventTypes(): readonly string[]
  
  /**
   * Inject the event store for this agent
   * This should be called once during agent initialization
   */
  setEventStore(eventStore: any): void
}

/**
 * RAG (Retrieval-Augmented Generation) Context Builder
 * Folds the event stream for a specific tenant into a prompt-ready context string
 */
export class RAGContextBuilder {
  /**
   * Build a comprehensive context string from event history
   * @param eventHistory - Array of event envelopes for the tenant
   * @param options - Configuration options for context building
   * @returns Formatted context string suitable for AI prompts
   */
  static buildContext(
    eventHistory: readonly EventEnvelope<GameEvent>[],
    options: RAGContextOptions = {}
  ): string {
    const {
      maxEvents = 100,
      includeTimestamps = true,
      includeMetadata = true,
      format = 'detailed'
    } = options
    
    // Sort events by sequence number for proper chronological order
    const sortedEvents = eventHistory
      .slice(-maxEvents)
      .sort((a, b) => a.seq - b.seq)
    
    if (format === 'summary') {
      return this.buildSummaryContext(sortedEvents, options)
    }
    
    return this.buildDetailedContext(sortedEvents, options)
  }
  
  /**
   * Build detailed context with full event information
   */
  private static buildDetailedContext(
    events: readonly EventEnvelope<GameEvent>[],
    options: RAGContextOptions
  ): string {
    const { includeTimestamps = true, includeMetadata = true } = options
    const lines: string[] = []
    
    lines.push(`=== Event History Context ===`)
    lines.push(`Total Events: ${events.length}`)
    lines.push(`Tenant: ${events[0]?.tenant_id || 'unknown'}`)
    lines.push(`Aggregate: ${events[0]?.aggregate_id || 'unknown'}`)
    lines.push(`Generated: ${new Date().toISOString()}`)
    lines.push('')
    
    for (const envelope of events) {
      const { event, timestamp, seq } = envelope
      const timeStr = includeTimestamps ? new Date(timestamp).toISOString() : ''
      
      lines.push(`[${seq}] ${timeStr} ${event.type}`)
      
      // Add event-specific details
      switch (event.type) {
        case 'game/started':
          lines.push(`  - Deck size: ${event.deck.length} rounds`)
          break
        case 'answer/submitted':
          lines.push(`  - Round ${event.roundIndex}: ${event.correct ? 'CORRECT' : 'INCORRECT'} (choice: ${event.choiceId})`)
          break
        case 'round/advanced':
          lines.push(`  - Advanced to round ${event.toRoundIndex}`)
          break
        case 'streak/updated':
          lines.push(`  - Streak: ${event.streak}`)
          break
        case 'language/changed':
          lines.push(`  - Language: ${event.language}`)
          break
        case 'game/finished':
          lines.push(`  - Final score: ${event.correct}/${event.total}`)
          break
      }
      
      if (includeMetadata) {
        lines.push(`  - Tenant: ${envelope.tenant_id}, Aggregate: ${envelope.aggregate_id}`)
      }
      
      lines.push('')
    }
    
    return lines.join('\n')
  }
  
  /**
   * Build summarized context focusing on key metrics
   */
  private static buildSummaryContext(
    events: readonly EventEnvelope<GameEvent>[],
    options: RAGContextOptions
  ): string {
    const summary = this.extractSummary(events)
    
    const lines: string[] = [
      `=== Game Session Summary ===`,
      `Tenant: ${events[0]?.tenant_id || 'unknown'}`,
      `Aggregate: ${events[0]?.aggregate_id || 'unknown'}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      `Session Statistics:`,
      `- Total Rounds: ${summary.totalRounds}`,
      `- Correct Answers: ${summary.correctAnswers}`,
      `- Accuracy: ${summary.accuracyPercentage}%`,
      `- Max Streak: ${summary.maxStreak}`,
      `- Language: ${summary.language}`,
      `- Status: ${summary.isFinished ? 'Finished' : 'In Progress'}`,
      ''
    ]
    
    if (summary.recentPerformance.length > 0) {
      lines.push('Recent Performance (last 10 rounds):')
      summary.recentPerformance.forEach((perf, index) => {
        lines.push(`  ${index + 1}. ${perf.correct ? '✓' : '✗'} Round ${perf.roundIndex}`)
      })
      lines.push('')
    }
    
    return lines.join('\n')
  }
  
  /**
   * Extract key metrics from event history
   */
  private static extractSummary(events: readonly EventEnvelope<GameEvent>[]) {
    let totalRounds = 0
    let correctAnswers = 0
    let maxStreak = 0
    let language = 'unknown'
    let isFinished = false
    const recentPerformance: Array<{ roundIndex: number; correct: boolean }> = []
    
    for (const envelope of events) {
      const { event } = envelope
      
      switch (event.type) {
        case 'game/started':
          totalRounds = event.deck.length
          break
        case 'answer/submitted':
          recentPerformance.push({
            roundIndex: event.roundIndex,
            correct: event.correct
          })
          if (recentPerformance.length > 10) {
            recentPerformance.shift()
          }
          break
        case 'streak/updated':
          maxStreak = Math.max(maxStreak, event.streak)
          break
        case 'language/changed':
          language = event.language
          break
        case 'game/finished':
          correctAnswers = event.correct
          isFinished = true
          break
      }
    }
    
    // Calculate correct answers from submitted events if not available from finished event
    if (correctAnswers === 0) {
      correctAnswers = events
        .filter(e => e.event.type === 'answer/submitted')
        .reduce((sum, e) => sum + (e.event.type === 'answer/submitted' && e.event.correct ? 1 : 0), 0)
    }
    
    const accuracyPercentage = totalRounds > 0 ? Math.round((correctAnswers / totalRounds) * 100) : 0
    
    return {
      totalRounds,
      correctAnswers,
      accuracyPercentage,
      maxStreak,
      language,
      isFinished,
      recentPerformance
    }
  }
}

/**
 * Configuration options for RAG context building
 */
export interface RAGContextOptions {
  /** Maximum number of events to include in context */
  maxEvents?: number
  /** Whether to include timestamps in the context */
  includeTimestamps?: boolean
  /** Whether to include metadata in the context */
  includeMetadata?: boolean
  /** Format style: 'detailed' or 'summary' */
  format?: 'detailed' | 'summary'
}

/**
 * Base implementation of an AI Agent
 * Can be extended for specific AI agent implementations
 */
export abstract class BaseAIAgent implements AIAgent {
  public readonly agentId: string
  public readonly name: string
  public readonly description: string
  
  protected subscribedEventTypes: Set<GameEventType> = new Set()
  protected eventStore?: any // Will be injected
  
  constructor(agentId: string, name: string, description: string) {
    this.agentId = agentId
    this.name = name
    this.description = description
  }
  
  subscribe(eventTypes: GameEventType[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.add(type))
  }
  
  unsubscribe(eventTypes: GameEventType[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.delete(type))
  }
  
  getSubscribedEventTypes(): readonly GameEventType[] {
    return Array.from(this.subscribedEventTypes)
  }
  
  emit(events: GameEvent[], tenant_id: string, aggregate_id: string): void {
    if (!this.eventStore) {
      throw new Error('EventStore not injected. Call setEventStore() first.')
    }
    
    // Add tenant_id and aggregate_id to events if not present
    const enrichedEvents = events.map(event => ({
      ...event,
      tenant_id,
      aggregate_id
    }))
    
    this.eventStore.commit(enrichedEvents, tenant_id, aggregate_id)
  }
  
  /**
   * Inject the event store for this agent
   * This should be called once during agent initialization
   */
  setEventStore(eventStore: any): void {
    this.eventStore = eventStore
  }
  
  /**
   * Abstract method to be implemented by concrete AI agents
   * @param context - Event context for decision-making
   * @returns Array of events to emit
   */
  abstract process(context: EventContext): GameEvent[]
}

/**
 * Example AI Agent: Adaptive Difficulty Agent
 * Adjusts game difficulty based on player performance
 */
export class AdaptiveDifficultyAgent extends BaseAIAgent {
  constructor() {
    super(
      'adaptive-difficulty-agent',
      'Adaptive Difficulty Agent',
      'Analyzes player performance and adjusts game difficulty accordingly'
    )
    
    // Subscribe to performance-related events
    this.subscribe(['answer/submitted', 'streak/updated', 'game/finished'])
  }
  
  process(context: EventContext): GameEvent[] {
    const events: GameEvent[] = []
    
    // Analyze recent performance
    const recentAnswers = context.eventHistory
      .filter(e => e.event.type === 'answer/submitted')
      .slice(-5) // Last 5 answers
    
    if (recentAnswers.length >= 5) {
      const correctRate = recentAnswers.filter(e => 
        e.event.type === 'answer/submitted' && e.event.correct
      ).length / recentAnswers.length
      
      // If player is doing very well, we could emit a difficulty increase event
      // If player is struggling, we could emit a difficulty decrease event
      // This is a placeholder for actual difficulty adjustment logic
      
      console.log(`[AI] Player accuracy: ${Math.round(correctRate * 100)}%`)
    }
    
    return events
  }
}
