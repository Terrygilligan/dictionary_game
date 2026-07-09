# AI Agent Framework - Adaptive Difficulty System

## Overview

The Lexicon Master now features a sophisticated AI Agent Framework that enables autonomous, self-optimizing gameplay experiences. The system follows the Event-Driven Architecture Blueprint, ensuring proper tenant isolation and event-first processing.

## 🏗️ Architecture

### Core Components

1. **AI Agent Interface** (`src/ai/agent.ts`)
   - Base interface for all AI agents
   - Event subscription and emission capabilities
   - RAG (Retrieval-Augmented Generation) context builder

2. **AdaptiveDifficultyAgent** (`src/ai/agents/adaptiveDifficultyAgent.ts`)
   - Real-time performance analysis
   - Dynamic difficulty adjustment
   - Tenant-isolated decision making

3. **AI Integration** (`src/ai/integration/aiIntegration.ts`)
   - Multi-tenant agent management
   - Event stream processing
   - Automatic agent lifecycle management

## 🎮 Adaptive Difficulty Agent

### Purpose

The AdaptiveDifficultyAgent monitors player performance in real-time and adjusts game difficulty to maintain optimal engagement. Each player (tenant) gets personalized difficulty adjustments based on their specific performance patterns.

### Features

- **Real-time Analysis**: Processes `answer/submitted` and `streak/updated` events
- **Performance Metrics**: Calculates accuracy, streaks, and trends
- **Dynamic Adjustment**: Emits `difficulty/adjusted` events when thresholds are met
- **Tenant Isolation**: Each player's adjustments are completely private

### Performance Scoring

The agent calculates a composite performance score (0-100) based on:

```typescript
// Weighted formula
score = accuracy * 0.6          // 60% weight
       + streakBonus * 0.2      // 20% weight  
       + maxStreakBonus * 0.1   // 10% weight
       + trendAdjustment * 0.1  // 10% weight
```

### Difficulty Thresholds

- **Increase**: Performance score ≥ 85% with improving trend
- **Decrease**: Performance score ≤ 45% with declining trend
- **Range**: Difficulty levels 1-10 (default: 5)

## 🔧 Integration

### Basic Setup

```typescript
import { createAIIntegration } from '@/ai/integration/aiIntegration'
import { createEventStore, evolveGame, initialGameState } from '@/entities/game'

// Create event store
const gameStore = createEventStore(evolveGame, initialGameState)

// Create AI integration
const aiIntegration = createAIIntegration(gameStore)

// Start processing for a specific player
const tenant_id = 'player_123'
const aggregate_id = 'game_session_456'
aiIntegration.startProcessing(tenant_id, aggregate_id)
```

### Event Flow

1. **Game Events** → EventStore (tenant-isolated)
2. **EventStore** → AI Integration (automatic processing)
3. **AI Agent** → Analysis → Difficulty Decision
4. **Decision** → `difficulty/adjusted` event
5. **Event** → Game State (difficulty level updated)

## 🎯 Event Types

### New Events Added

```typescript
// Difficulty adjustment event
interface DifficultyAdjustedEvent {
  readonly type: 'difficulty/adjusted'
  readonly tenant_id: string
  readonly aggregate_id: string
  readonly newDifficulty: number
  readonly previousDifficulty: number
  readonly performanceScore: number
  readonly adjustmentReason: string
  readonly timestamp: number
}
```

### Monitored Events

- `answer/submitted` - Performance tracking
- `streak/updated` - Streak analysis
- `game/finished` - Session completion

## 🏢 Multi-Tenant Architecture

### Tenant Isolation

Each player gets completely isolated AI processing:

```typescript
// Player A's events never affect Player B
playerA_events → AdaptiveDifficultyAgent → difficulty_adjusted_A
playerB_events → AdaptiveDifficultyAgent → difficulty_adjusted_B
```

### Agent Management

```typescript
// Each tenant gets their own agent instance
const agent = aiIntegration.getAgentManager()
  .getAgent(tenant_id, aggregate_id, 'adaptive-difficulty')
```

## 📊 Usage Examples

### Real-time Monitoring

```typescript
// Monitor AI decisions
const agentManager = aiIntegration.getAgentManager()
const stats = agentManager.getStats()

console.log('AI Statistics:', {
  totalTenants: stats.totalTenants,
  totalAgents: stats.totalAgents,
  agentsByTenant: stats.agentsByTenant
})
```

### Event Analysis

```typescript
// Get difficulty adjustment history
const events = gameStore.getLog(tenant_id, aggregate_id)
const difficultyEvents = events.filter(e => e.event.type === 'difficulty/adjusted')

difficultyEvents.forEach(e => {
  const event = e.event as DifficultyAdjustedEvent
  console.log(`Difficulty: ${event.previousLevel} → ${event.newLevel}`)
  console.log(`Reason: ${event.adjustmentReason}`)
  console.log(`Performance: ${event.performanceScore}%`)
})
```

## 🔍 Monitoring & Debugging

### Agent Logs

The agent provides detailed logging for monitoring:

```
🤖 [AI] AdaptiveDifficultyAgent initialized
🤖 [AI] Processing events for tenant: player_123, aggregate: game_session_456
🤖 [AI] Performance metrics: { accuracy: 90, currentStreak: 5, performanceScore: 88 }
🤖 [AI] Adjusting difficulty: 5 → 7 (High performance (88%) with improving trend)
🤖 [AI] Emitting 1 events for tenant: player_123
```

### Performance Metrics

Track agent effectiveness:

- **Adjustment Frequency**: How often difficulty changes
- **Performance Correlation**: Do adjustments improve engagement?
- **Tenant Distribution**: Usage across different players

## 🚀 Advanced Features

### Custom Difficulty Algorithms

Extend the agent with custom scoring:

```typescript
class CustomDifficultyAgent extends AdaptiveDifficultyAgent {
  protected calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Custom algorithm here
    return customScore
  }
}
```

### Multiple Agent Coordination

Combine multiple AI agents:

```typescript
// Adaptive difficulty + Content recommendation
const adaptiveAgent = createAdaptiveDifficultyAgent()
const contentAgent = createContentRecommendationAgent()

// Both agents process the same event stream
aiIntegration.startProcessing(tenant_id, aggregate_id)
```

## 🔒 Security & Privacy

### Tenant Isolation

- ✅ Events filtered by `tenant_id` at store level
- ✅ Agent instances isolated per tenant
- ✅ No cross-tenant data leakage
- ✅ Private difficulty adjustments

### Event Security

- ✅ All events include tenant verification
- ✅ Agents can only access their tenant's events
- ✅ Audit trail maintained in event log

## 📈 Performance Considerations

### Optimization

- **Event Filtering**: Agents only process relevant event types
- **Async Processing**: Non-blocking event analysis
- **Tenant Caching**: Agent instances cached per tenant
- **Batch Processing**: Multiple events processed together

### Scalability

- **Horizontal Scaling**: Multiple agent instances
- **Load Distribution**: Events distributed across agents
- **Memory Management**: Automatic cleanup for inactive tenants

## 🧪 Testing

### Unit Tests

```typescript
// Test agent decision making
const agent = createAdaptiveDifficultyAgent()
const context = createMockEventContext()
const events = agent.process(context)

expect(events).toHaveLength(1)
expect(events[0].type).toBe('difficulty/adjusted')
```

### Integration Tests

```typescript
// Test full event flow
const gameStore = createMockEventStore()
const aiIntegration = createAIIntegration(gameStore)

// Simulate game session
simulateGameSession(gameStore, tenant_id, aggregate_id)

// Verify difficulty adjustments
const events = gameStore.getLog(tenant_id, aggregate_id)
const difficultyEvents = events.filter(e => e.event.type === 'difficulty/adjusted')
expect(difficultyEvents.length).toBeGreaterThan(0)
```

## 🔮 Future Enhancements

### Planned Features

1. **Machine Learning Integration**: Replace rule-based logic with ML models
2. **Multi-Dimensional Difficulty**: Adjust word complexity, time limits, hints
3. **Social Difficulty**: Competitive vs cooperative modes
4. **Predictive Analytics**: Forecast player performance
5. **A/B Testing**: Compare different difficulty strategies

### Extension Points

- **Custom Agents**: Easy to add new AI agent types
- **Event Types**: Extend with new game events
- **Metrics**: Add custom performance metrics
- **Algorithms**: Implement different scoring systems

## 📚 Documentation

- **Event-Driven Architecture Blueprint**: `docs/EVENT_DRIVEN_ARCHITECTURE_BLUEPRINT.md`
- **API Reference**: Inline TypeScript documentation
- **Examples**: `src/ai/examples/adaptiveDifficultyExample.ts`
- **Integration Guide**: This README

---

## 🎯 Summary

The AdaptiveDifficultyAgent transforms Lexicon Master from a static game into a dynamic, self-optimizing platform. Each player gets personalized difficulty adjustments based on their real-time performance, all while maintaining strict tenant isolation and following the Event-Driven Architecture Blueprint.

The system is production-ready, thoroughly tested, and designed for scalability. Future enhancements can easily extend the framework without breaking existing functionality.
