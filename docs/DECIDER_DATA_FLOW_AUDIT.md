# Decider Data Flow Audit - Adaptive Progression Engine

**Audit Date**: 2026-07-19  
**Purpose**: Comprehensive audit of decider layer data flow for adaptive progression engine  
**Scope**: All decider files, state evolution, event emission, and adaptive logic

---

## Executive Summary

The Lexicon Master platform has a sophisticated adaptive progression architecture but suffers from **critical data flow disconnects** between state definitions, event emissions, and adaptive logic. The system contains adaptive state structures that are never updated, events lacking essential telemetry metadata, and hardcoded thresholds that should be state-driven.

**Audit Score**: 4/10 - Architecture exists but implementation is fragmented and incomplete

---

## 1. Decider Files Inventory

### 1.1 Core Game Deciders

| File | Purpose | Adaptive Features |
|------|---------|-------------------|
| `src/entities/game/model/decide.ts` | Main game logic | Milestone gatekeeper, difficulty filtering |
| `src/entities/game/model/main-game/decide.ts` | Dictionary game navigation | None (linear progression) |
| `src/entities/user/model/decide.ts` | User profile management | Stats tracking, guest access limits |
| `src/entities/vocabulary/model/decide.ts` | Vocabulary management | None (CRUD operations) |
| `src/entities/village/model/decide.ts` | Village/community features | None (social features) |

### 1.2 Adaptive Logic Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| **AdaptiveDifficultyAgent** | AI Agent | `src/ai/agents/adaptiveDifficultyAgent.ts` | Real-time difficulty adjustment |
| **Milestone Gatekeeper** | Decider Function | `src/entities/game/model/decide.ts` | Progression control |
| **Difficulty Filter** | Decider Function | `src/entities/game/model/decide.ts` | Content filtering |

---

## 2. Data Flow Mapping

### 2.1 Main Game Decider (`decide.ts`)

#### **Command Data Sources**

| Command | Input Fields | Source | Adaptive Relevance |
|---------|-------------|--------|-------------------|
| `startGame` | deck, milestone_id, game_mode | UI (deck builder) | **HIGH** - Milestone gatekeeper input |
| `submitAnswer` | choiceId | UI (user interaction) | **CRITICAL** - Missing timing data |
| `nextRound` | (none) | UI (navigation) | **LOW** - Progression trigger |
| `resetStreak` | (none) | UI (manual) | **LOW** - State reset |
| `setLanguage` | language | UI (settings) | **MEDIUM** - Localization |
| `resetGame` | reason | UI/system | **LOW** - Session management |

#### **Context Injection** (Edge Layer)

```typescript
// From gameStore.ts - Line 50-54
const context = {
  timestamp: Date.now(),        // ⚠️ UNUSED by decider
  userId: command.tenant_id,    // ⚠️ UNUSED by decider  
  correlationId: crypto.randomUUID() // ⚠️ UNUSED by decider
}
```

**Critical Issue**: Context is injected but completely ignored by decider (Line 80: `void context`)

#### **State Variables Used**

| State Variable | Type | Current Usage | Adaptive Potential |
|----------------|------|---------------|-------------------|
| `proficiency_map` | `ProficiencyMap` | **READ-ONLY** - Never updated | **HIGH** - Spaced repetition |
| `user_performance` | `UserPerformanceState` | **READ-ONLY** - Never updated | **HIGH** - Confidence calculations |
| `current_milestone` | `number` | Gatekeeper logic | **HIGH** - Progression control |
| `currentDifficulty` | `number` | State storage only | **HIGH** - Adaptive tuning |
| `streak` | `number` | Streak tracking | **MEDIUM** - Engagement metrics |
| `deck` | `RoundSpec[]` | Round data | **MEDIUM** - Content analysis |

#### **Emitted Events**

| Event | Payload Fields | Adaptive Metadata | Gap Analysis |
|-------|---------------|-------------------|--------------|
| `game/started` | deck, milestone_id, game_mode | ✅ milestone_id | ❌ Missing difficulty context |
| `answer/submitted` | roundIndex, choiceId, correct | ❌ **NONE** | **CRITICAL** - Missing wordId, difficulty, responseTime, timestamp |
| `streak/updated` | streak | ✅ streak value | ✅ Adequate |
| `round/advanced` | toRoundIndex | ❌ **NONE** | ❌ Missing timing data |
| `game/finished` | correct, total | ✅ Basic metrics | ❌ Missing session duration |
| `difficulty/adjusted` | newDifficulty, previousDifficulty, performanceScore, adjustmentReason, timestamp | ✅ Rich metadata | ✅ Good (from AI agent) |

---

### 2.2 Adaptive Difficulty Agent (`adaptiveDifficultyAgent.ts`)

#### **Data Ingestion**

| Source | Data Type | Usage |
|--------|-----------|-------|
| `eventHistory` | `EventContext[]` | Performance metrics calculation |
| `answer/submitted` events | Correct/incorrect tracking | Accuracy calculation |
| `streak/updated` events | Streak values | Trend analysis |
| `game/finished` events | Session completion | Performance scoring |

#### **Calculated Metrics**

```typescript
interface PerformanceMetrics {
  accuracy: number              // From answer events
  currentStreak: number         // From streak events  
  maxStreak: number             // From streak events
  recentTrend: 'improving' | 'declining' | 'stable'  // Calculated
  totalRounds: number           // Event count
  performanceScore: number      // Composite score (0-100)
}
```

#### **Emitted Events**

```typescript
interface DifficultyAdjustedEvent {
  type: 'difficulty/adjusted'
  tenant_id: string
  aggregate_id: string
  newDifficulty: number         // ✅ Adaptive result
  previousDifficulty: number    // ✅ Context
  performanceScore: number      // ✅ Calculation basis
  adjustmentReason: string      // ✅ Explanation
  timestamp: number             // ✅ Timing
}
```

**Strength**: Rich event payload with good telemetry
**Weakness**: Separate from core decider, creates parallel adaptive system

---

### 2.3 State Evolution Analysis (`state.ts`)

#### **Critical Gap: Proficiency Tracking Not Updated**

```typescript
// Lines 35-46: answer/submitted evolution
case 'answer/submitted':
  return {
    ...state,
    answers: [
      ...state.answers,
      {
        roundIndex: event.roundIndex,
        choiceId: event.choiceId,
        correct: event.correct,
      },
    ],
  }
```

**Problem**: 
- ❌ `proficiency_map` is **NOT updated** on answer/submitted
- ❌ `user_performance` is **NOT updated** on answer/submitted
- ❌ Word-level tracking exists in state but never evolves
- ❌ Adaptive state structures are **dead code**

#### **Impact on Adaptive Logic**

| Adaptive Feature | State Dependency | Evolution Status | Impact |
|------------------|------------------|------------------|---------|
| Spaced Repetition | `proficiency_map` | **NOT EVOLVING** | **BROKEN** |
| Confidence Calculations | `user_performance` | **NOT EVOLVING** | **BROKEN** |
| Semantic Group Analysis | `groupPerformance` | **NOT EVOLVING** | **BROKEN** |
| Milestone Gatekeeper | `proficiency_map` | **NOT EVOLVING** | **DEGRADED** |

---

## 3. Adaptive Logic Analysis

### 3.1 Milestone Gatekeeper Function

**Location**: `src/entities/game/model/decide.ts` (Lines 14-42)

```typescript
function isReadyForNextMilestone(state: GameState, targetMilestone: number): boolean {
  const { current_milestone, proficiency_map } = state

  // Cannot skip milestones
  if (targetMilestone > current_milestone + 1) {
    return false
  }

  // Same milestone is always allowed
  if (targetMilestone <= current_milestone) {
    return true
  }

  // Check if current milestone proficiency is sufficient (> 70% success rate)
  const currentMilestoneWords = Array.from(proficiency_map.values())
    .filter(word => word.wordId.includes(`milestone_${current_milestone}`))

  if (currentMilestoneWords.length === 0) {
    return true  // No words attempted, allow progression
  }

  const milestoneProficiency = currentMilestoneWords.reduce((sum, word) => 
    sum + (word.correct / word.total), 0) / currentMilestoneWords.length

  return milestoneProficiency > 0.7  // ❌ HARDCODED THRESHOLD
}
```

**Analysis**:
- ✅ Uses state-based proficiency tracking
- ❌ **HARDCODED 70% threshold** - should be configurable
- ❌ Relies on `proficiency_map` which is never updated
- ❌ String-based wordId filtering is fragile

### 3.2 Difficulty Filtering Function

**Location**: `src/entities/game/model/decide.ts` (Lines 51-70)

```typescript
function filterWordsByDifficulty(
  words: readonly { wordId: string; difficulty?: number }[],
  state: GameState
): readonly { wordId: string; difficulty?: number }[] {
  const { current_milestone, proficiency_map } = state

  // If user is struggling with foundational words, filter out high difficulty
  const foundationalProficiency = Array.from(proficiency_map.values())
    .filter(word => word.wordId.includes('milestone_1'))
    .reduce((sum, word) => sum + (word.correct / word.total), 0) / 
    (proficiency_map.size || 1)

  if (foundationalProficiency < 0.6 && current_milestone === 1) {
    return words.filter(word => 
      !word.difficulty || word.difficulty <= 5  // ❌ HARDCODED threshold
    )
  }

  return words
}
```

**Analysis**:
- ✅ Attempts adaptive content filtering
- ❌ **HARDCODED 60% proficiency threshold**
- ❌ **HARDCODED difficulty <= 5 filter**
- ❌ Relies on `proficiency_map` which is never updated
- ❌ String-based milestone filtering is fragile

### 3.3 Adaptive Difficulty Agent Logic

**Location**: `src/ai/agents/adaptiveDifficultyAgent.ts` (Lines 288-337)

```typescript
private determineDifficultyAdjustment(metrics: PerformanceMetrics): {
  shouldAdjust: boolean
  newLevel: number
  previousLevel: number
  reason: string
} {
  const { performanceScore, recentTrend, accuracy } = metrics
  const { increase, decrease, min, max } = this.difficultyThresholds  // ❌ HARDCODED
  
  // Default: no adjustment
  let shouldAdjust = false
  let newLevel = 5  // ❌ HARDCODED default
  let previousLevel = 5
  let reason = 'No adjustment needed'
  
  // Increase difficulty if performing very well
  if (performanceScore >= increase && recentTrend === 'improving') {  // ❌ 85% hardcoded
    shouldAdjust = true
    newLevel = Math.min(max, 5 + Math.floor((performanceScore - increase) / 10))
    previousLevel = 5
    reason = `High performance (${performanceScore}%) with improving trend`
  }
  // Decrease difficulty if struggling
  else if (performanceScore <= decrease && recentTrend === 'declining') {  // ❌ 45% hardcoded
    shouldAdjust = true
    newLevel = Math.max(min, 5 - Math.floor((decrease - performanceScore) / 10))
    previousLevel = 5
    reason = `Low performance (${performanceScore}%) with declining trend`
  }
  
  return { shouldAdjust, newLevel, previousLevel, reason }
}
```

**Analysis**:
- ✅ Sophisticated performance scoring algorithm
- ❌ **HARDCODED thresholds** (85% increase, 45% decrease, min/max 1-10)
- ❌ **HARDCODED default difficulty level 5**
- ❌ Separate from core decider (architectural duplication)
- ✅ Good event telemetry in emitted events

---

## 4. Invisible Dependencies (Hardcoded Constants)

### 4.1 Decider Level

| Location | Constant | Value | Impact |
|----------|----------|-------|--------|
| `decide.ts:39` | Milestone proficiency threshold | `0.7` (70%) | Progression control |
| `decide.ts:63` | Foundational proficiency threshold | `0.6` (60%) | Content filtering |
| `decide.ts:65` | Max difficulty for struggling users | `5` | Content difficulty |
| `state.ts:13` | Default difficulty | `5` | Initial game difficulty |
| `state.ts:14` | Default milestone | `1` | Initial progression level |

### 4.2 AI Agent Level

| Location | Constant | Value | Impact |
|----------|----------|-------|--------|
| `adaptiveDifficultyAgent.ts:71` | Performance increase threshold | `85` | Difficulty increase |
| `adaptiveDifficultyAgent.ts:73` | Performance decrease threshold | `45` | Difficulty decrease |
| `adaptiveDifficultyAgent.ts:75` | Minimum difficulty | `1` | Difficulty range |
| `adaptiveDifficultyAgent.ts:77` | Maximum difficulty | `10` | Difficulty range |
| `adaptiveDifficultyAgent.ts:299` | Default difficulty | `5` | Fallback difficulty |
| `adaptiveDifficultyAgent.ts:255` | Streak calculation divisor | `10` | Streak bonus scaling |
| `adaptiveDifficultyAgent.ts:259` | Max streak divisor | `15` | Achievement scaling |

### 4.3 Impact Assessment

**Risk Level**: **HIGH**
- Configuration requires code changes
- No runtime adjustment capability
- Different thresholds across components (inconsistency)
- No A/B testing capability
- No per-user customization

---

## 5. Discrepancies: Calculations vs. Events

### 5.1 Critical Gaps

| Adaptive Calculation | Event Emission | Gap | Impact |
|---------------------|----------------|-----|--------|
| **Word-level proficiency** | `answer/submitted` missing `wordId` | **CRITICAL** | Cannot track per-word performance |
| **Response time analysis** | `answer/submitted` missing `responseTimeMs` | **CRITICAL** | Cannot measure engagement |
| **Difficulty context** | `answer/submitted` missing `difficulty` | **HIGH** | Cannot correlate performance with difficulty |
| **Semantic group tracking** | Events missing `semanticGroup` | **HIGH** | Cannot analyze category performance |
| **Session analytics** | Events missing session duration | **MEDIUM** | Cannot track engagement patterns |
| **Milestone progression** | `game/started` has milestone_id but answers don't | **MEDIUM** | Cannot track milestone-specific performance |

### 5.2 State vs. Event Disconnect

**Example: Word Proficiency Tracking**

```typescript
// State has sophisticated tracking structure:
interface WordProficiency {
  readonly wordId: string
  readonly correct: number
  readonly total: number
  readonly lastAttemptedAt?: number
}

// But answer/submitted event doesn't include wordId:
{
  type: 'answer/submitted',
  roundIndex: state.currentRound,  // ❌ Cannot map back to word
  choiceId: choice.id,             // ❌ Choice ID, not word ID
  correct: choice.correct,         // ✅ Has result
  // ❌ Missing: wordId, difficulty, semanticGroup, responseTimeMs
}

// Result: Proficiency tracking exists but cannot be populated
```

### 5.3 AI Agent vs. Core Decider Disconnect

**AdaptiveDifficultyAgent** calculates comprehensive metrics but:
- ❌ Operates outside core decider flow
- ❌ Has separate event emission logic
- ❌ Cannot access internal state structures
- ❌ Creates parallel adaptive system

**Core Decider** has state structures for adaptive logic but:
- ❌ Never updates the adaptive state
- ❌ Doesn't use injected context
- ❌ Emits events without adaptive metadata
- ❌ Has hardcoded thresholds

---

## 6. Summary Table: Decider Data Flow

| Decider/Logic | Input Data Source | Key State Variables | Emitted Event Fields | Adaptive Readiness |
|---------------|------------------|---------------------|---------------------|-------------------|
| **Main Game Decider** | UI commands (deck, choiceId) | proficiency_map (unused), user_performance (unused), current_milestone, currentDifficulty | game/started (deck, milestone_id), answer/submitted (roundIndex, choiceId, correct), streak/updated (streak) | **30%** - State exists but not used |
| **Milestone Gatekeeper** | state.proficiency_map, targetMilestone | proficiency_map (never updated) | (None - internal logic) | **20%** - Logic broken by state gap |
| **Difficulty Filter** | state.proficiency_map, words array | proficiency_map (never updated) | (None - internal logic) | **20%** - Logic broken by state gap |
| **Adaptive Difficulty Agent** | eventHistory (answer/submitted, streak/updated) | (None - uses event stream) | difficulty/adjusted (newDifficulty, performanceScore, reason) | **80%** - Good logic but architecturally separate |
| **User Decider** | UI commands (stats updates) | user.stats | stats/updated (gamesPlayed, correctAnswers, etc.) | **60%** - Basic stats tracking |
| **Vocabulary Decider** | UI commands (word entries) | wordIds | wordDefinitionAdded (entry data) | **0%** - No adaptive features |

---

## 7. Recommendations

### 7.1 Critical Fixes (Priority 1)

1. **Fix State Evolution** (`state.ts`)
   ```typescript
   case 'answer/submitted':
     const wordId = state.deck[state.currentRound]?.wordId
     if (!wordId) return state
     
     // Update proficiency map
     const updatedProficiency = new Map(state.proficiency_map)
     const existingProficiency = updatedProficiency.get(wordId) || { 
       wordId, correct: 0, total: 0, lastAttemptedAt: undefined 
     }
     updatedProficiency.set(wordId, {
       wordId,
       correct: existingProficiency.correct + (event.correct ? 1 : 0),
       total: existingProficiency.total + 1,
       lastAttemptedAt: event.timestamp ?? Date.now()
     })
     
     // Update user performance
     // ... similar logic for user_performance
     
     return { ...state, proficiency_map: updatedProficiency, /* ... */ }
   ```

2. **Enhance answer/submitted Event** (`decide.ts`)
   ```typescript
   const round = selectCurrentRound(state)
   const wordId = round?.wordId
   const difficulty = round?.milestone_id ?? 5  // Or from lexicon
   
   return [{
     type: 'answer/submitted',
     roundIndex: state.currentRound,
     choiceId: choice.id,
     correct: choice.correct,
     wordId,                    // NEW
     difficulty,                // NEW
     responseTimeMs: context.responseTimeMs,  // NEW from context
     timestamp: context.timestamp,  // NEW
     tenant_id,
     aggregate_id,
   }]
   ```

3. **Use Context in Decider** (`decide.ts`)
   ```typescript
   export const decideGame: Decider<GameState, GameCommand, GameEvent> = (
     state, command, context
   ) => {
     const { timestamp, userId, correlationId } = context
     // Actually use these values in decisions
   ```

### 7.2 Configuration Management (Priority 2)

1. **Extract Hardcoded Constants**
   ```typescript
   interface AdaptiveThresholds {
     milestoneProficiency: number      // 0.7
     foundationalProficiency: number   // 0.6
     maxFoundationalDifficulty: number // 5
     performanceIncrease: number       // 85
     performanceDecrease: number       // 45
     minDifficulty: number            // 1
     maxDifficulty: number            // 10
     defaultDifficulty: number        // 5
   }
   
   // Make these configurable via context or state
   ```

2. **Add Threshold Configuration to Context**
   ```typescript
   interface DeciderContext {
     readonly timestamp: number
     readonly userId?: string
     readonly correlationId?: string
     readonly adaptiveThresholds?: AdaptiveThresholds
   }
   ```

### 7.3 Architectural Unification (Priority 3)

1. **Integrate AI Agent into Core Flow**
   - Move adaptive logic into decider or make it a state projection
   - Eliminate parallel adaptive systems
   - Ensure single source of truth for adaptive decisions

2. **Enhance RoundSpec with Lexicon Data**
   ```typescript
   interface RoundSpec {
     readonly wordId: string
     readonly term: string
     readonly partOfSpeech: string
     readonly choices: readonly Choice[]
     readonly milestone_id?: number
     readonly difficulty?: number        // NEW
     readonly polysemy?: number           // NEW
     readonly semanticGroup?: string      // NEW
   }
   ```

---

## 8. Conclusion

The Lexicon Master platform has excellent architectural foundations for adaptive progression but suffers from **implementation fragmentation** and **critical data flow gaps**:

**Key Issues**:
1. **State Evolution Gap**: Adaptive state structures exist but are never updated
2. **Event Metadata Gap**: Events lack essential telemetry for adaptive calculations
3. **Context Underutilization**: Rich context is injected but ignored by decider
4. **Hardcoded Dependencies**: Configuration requires code changes
5. **Architectural Duplication**: Parallel adaptive systems create inconsistency

**Estimated Effort**: 2-3 weeks to fix critical gaps and unify architecture

**Priority Focus**:
1. Fix state evolution for proficiency tracking (CRITICAL)
2. Enhance events with adaptive metadata (CRITICAL)
3. Utilize context in decider logic (HIGH)
4. Extract hardcoded constants (HIGH)
5. Unify adaptive architecture (MEDIUM)

The platform's commitment to pure function architecture provides a solid foundation, but the adaptive progression engine requires significant implementation work to match the architectural vision.
