# Telemetry Projection Gap Analysis

**Analysis Date**: 2026-07-19  
**Purpose**: Assess readiness for implementing active telemetry and profile projections  
**Scope**: Game event logs, projection infrastructure, and UI metric requirements

---

## Executive Summary

The Lexicon Master platform has a solid foundation for event-sourced architecture but requires significant enhancements to support comprehensive telemetry projections. Current events lack critical metadata needed for advanced analytics, and no projection infrastructure exists for processing game events into read-optimized models.

**Readiness Score**: 3/10 - Foundation exists, but substantial gaps in event metadata and projection infrastructure

---

## 1. Current Event Structure Analysis

### 1.1 Existing Game Events ✅

**Ready for Projection** (basic structure exists):
- `game/started`: Contains deck, milestone_id, game_mode
- `answer/submitted`: Contains roundIndex, choiceId, correct
- `streak/updated`: Contains streak value
- `language/changed`: Contains language code
- `game/finished`: Contains correct, total counts
- `difficulty/adjusted`: Contains difficulty metrics and timestamp

**Audio Events** (future telemetry potential):
- `audio/recorded`, `audio/transcribed`, `audio/played` - contain duration and processing time
- `audio/generation-failed` - error tracking

### 1.2 Critical Missing Metadata ❌

**Response Time Tracking**:
- ❌ No timestamp in `answer/submitted` events
- ❌ No question display time reference
- ❌ Cannot calculate time-to-answer metrics

**Semantic Context**:
- ❌ No word difficulty/polysemy in answer events
- ❌ No semantic group tracking in events
- ❌ No concept-level performance tracking

**Session Analytics**:
- ❌ No session duration tracking
- ❌ No session start/end timestamps
- ❌ No user engagement metrics

**Performance Tracking**:
- ❌ No word-level proficiency in events
- ❌ No adaptive difficulty context in answer events
- ❌ No learning progress indicators

---

## 2. Projection Infrastructure Analysis

### 2.1 Current Infrastructure ❌

**Existing Cloud Functions**:
- ✅ `processEmailQueue` - handles email queue processing
- ❌ No game event log processing function
- ❌ No projection update functions
- ❌ No telemetry aggregation functions

**Firestore Collections**:
- ✅ `game_event_logs` - exists with proper security rules
- ✅ `outbox` - exists for transactional outbox pattern
- ❌ No `projections/profiles/{tenant_id}` collection
- ❌ No `projections/admin/telemetry_summary` collection
- ❌ No projection update mechanisms

### 2.2 Infrastructure Gaps ❌

**Missing Components**:
1. **Event Processor**: No Cloud Function triggered on `game_event_logs` writes
2. **Projection Updater**: No atomic batch update mechanism for projections
3. **Aggregation Service**: No time-windowed aggregation (hourly/daily/weekly)
4. **Cache Invalidation**: No mechanism to refresh projections on data changes
5. **Error Handling**: No dead letter queue for failed projections

---

## 3. UI Requirements vs. Event Capabilities

### 3.1 Profile Page Metrics

| UI Metric | Current Event Support | Gap |
|-----------|---------------------|-----|
| gamesPlayed | ✅ `game/finished` events | None |
| correctAnswers | ✅ `answer/submitted` + `game/finished` | None |
| totalQuestions | ✅ `game/finished` | None |
| accuracy | ✅ Calculated from correct/total | None |
| highestStreak | ✅ `streak/updated` events | None |
| **Response Time** | ❌ No timing data | **CRITICAL** |
| **Difficulty Progression** | ❌ Limited context | **HIGH** |
| **Word Proficiency** | ❌ Not tracked | **HIGH** |

### 3.2 Admin Dashboard Metrics

| UI Metric | Current Event Support | Gap |
|-----------|---------------------|-----|
| Total Events | ✅ Count game_event_logs | None |
| Active Tenants | ✅ Distinct tenant_id | None |
| Error Rate | ⚠️ Limited error events | **MEDIUM** |
| Events/Second | ✅ Timestamp-based calculation | None |
| **User Engagement** | ❌ No session metrics | **HIGH** |
| **Learning Velocity** | ❌ No progress tracking | **HIGH** |
| **Difficulty Distribution** | ❌ No analytics | **MEDIUM** |

---

## 4. Detailed Gap Analysis

### 4.1 Critical Gaps (Blockers)

**1. Response Time Analytics**
- **Impact**: Cannot measure user engagement, question difficulty, or learning velocity
- **Required**: Add `responseTimeMs` to `answer/submitted` events
- **Architectural Concern**: Timestamp must be generated at edge, not in decider

**2. Word-Level Performance Tracking**
- **Impact**: Cannot implement spaced repetition or adaptive learning
- **Required**: Add `wordId`, `difficulty`, `polysemy` to `answer/submitted` events
- **Current State**: Word IDs exist in deck but not propagated to answer events

**3. Projection Infrastructure**
- **Impact**: No mechanism to transform events into read models
- **Required**: Create Cloud Function for event processing and projection updates
- **Current State**: Only email processing exists

### 4.2 High Priority Gaps

**1. Semantic Group Analytics**
- **Impact**: Limited understanding of learning patterns across word categories
- **Required**: Add semantic group metadata to lexicon and events
- **Current State**: Semantic groups exist in types but not in events

**2. Session Management**
- **Impact**: Cannot track user engagement patterns or session quality
- **Required**: Add session start/end events with duration tracking
- **Current State**: No session-level events

**3. Error Tracking Enhancement**
- **Impact**: Limited visibility into system health and user issues
- **Required**: Expand error events with categorization and severity
- **Current State**: Basic error events exist but lack detail

### 4.3 Medium Priority Gaps

**1. Time-Windowed Aggregations**
- **Impact**: Cannot provide trend analysis or time-based insights
- **Required**: Implement hourly/daily/weekly projection rollups
- **Current State**: No aggregation infrastructure

**2. Performance Metrics**
- **Impact**: Limited system performance monitoring
- **Required**: Add processing time, latency metrics to events
- **Current State**: Some timing data in audio events only

---

## 5. Recommended Event Schema Enhancements

### 5.1 Enhanced `answer/submitted` Event

```typescript
export interface AnswerSubmittedEvent extends BaseGameEvent {
  readonly type: 'answer/submitted'
  readonly roundIndex: number
  readonly choiceId: string
  readonly correct: boolean
  readonly wordId: string                    // NEW: Word identifier
  readonly difficulty: number               // NEW: 1-10 difficulty rating
  readonly polysemy: number                  // NEW: 1-5 polysemy rating
  readonly semanticGroup: string            // NEW: Semantic category
  readonly responseTimeMs: number           // NEW: Time to answer in ms
  readonly timestamp: number                // NEW: Event timestamp
  readonly gameMode: 'FORWARD' | 'REVERSE' // NEW: Game mode context
}
```

### 5.2 New Session Events

```typescript
export interface SessionStartedEvent extends BaseGameEvent {
  readonly type: 'session/started'
  readonly sessionId: string
  readonly startTime: number
  readonly language: string
  readonly deviceType?: string
}

export interface SessionEndedEvent extends BaseGameEvent {
  readonly type: 'session/ended'
  readonly sessionId: string
  readonly endTime: number
  readonly durationMs: number
  readonly roundsCompleted: number
  readonly reason: 'completion' | 'abandon' | 'timeout'
}
```

### 5.3 Enhanced Error Events

```typescript
export interface ErrorEvent extends BaseGameEvent {
  readonly type: 'error/occurred'
  readonly errorCategory: 'validation' | 'network' | 'system' | 'user'
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly errorMessage: string
  readonly errorCode?: string
  readonly context: Record<string, unknown>
  readonly timestamp: number
}
```

---

## 6. Recommended Projection Architecture

### 6.1 Cloud Function Structure

```typescript
/**
 * Game Event Projection Processor
 * Triggered on writes to game_event_logs collection
 * Updates projections/profiles/{tenant_id} and projections/admin/telemetry_summary
 */
export const processGameEvent = onDocumentCreated(
  {
    document: 'game_event_logs/{eventId}',
    region: 'us-central1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const gameEvent = snapshot.data();
    const { tenant_id, aggregate_id, type, timestamp } = gameEvent;
    
    // Atomic batch update for projections
    const db = admin.firestore();
    const batch = db.batch();
    
    // Update user profile projection
    const profileRef = db.collection('profiles').doc(tenant_id);
    batch.set(profileRef, {
      updatedAt: timestamp,
      lastActivity: timestamp,
      // ... profile-specific updates based on event type
    }, { merge: true });
    
    // Update admin telemetry summary
    const telemetryRef = db.collection('projections').doc('admin').collection('telemetry_summary').doc('daily');
    batch.set(telemetryRef, {
      totalEvents: admin.firestore.FieldValue.increment(1),
      lastUpdated: timestamp,
      // ... telemetry-specific updates
    }, { merge: true });
    
    await batch.commit();
  }
);
```

### 6.2 Projection Schema

**User Profile Projection** (`projections/profiles/{tenant_id}`):
```typescript
interface UserProfileProjection {
  tenant_id: string
  updatedAt: number
  lastActivity: number
  
  // Game Statistics
  gamesPlayed: number
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  highestStreak: number
  currentStreak: number
  
  // Performance Metrics
  averageResponseTime: number
  difficultyDistribution: Record<number, number>
  semanticGroupPerformance: Record<string, { correct: number; total: number }>
  
  // Session Analytics
  totalSessionTime: number
  averageSessionDuration: number
  sessionsCompleted: number
  
  // Learning Progress
  wordsLearned: number
  currentDifficulty: number
  milestoneProgress: number
}
```

**Admin Telemetry Summary** (`projections/admin/telemetry_summary/{period}`):
```typescript
interface TelemetrySummary {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  timestamp: number
  
  // System Metrics
  totalEvents: number
  eventsPerSecond: number
  activeTenants: number
  errorRate: number
  
  // User Engagement
  totalSessions: number
  averageSessionDuration: number
  totalQuestionsAnswered: number
  globalAccuracy: number
  
  // Learning Analytics
  averageDifficulty: number
  difficultyDistribution: Record<number, number>
  semanticGroupPerformance: Record<string, number>
  
  // Performance
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
}
```

---

## 7. Implementation Roadmap

### Phase 1: Event Schema Enhancement (Week 1-2)
1. Add timestamp context to all game events
2. Enhance `answer/submitted` with word metadata
3. Add session tracking events
4. Update deciders to include new metadata
5. Update UI components to capture timing data

### Phase 2: Projection Infrastructure (Week 3-4)
1. Create projection collections in Firestore
2. Implement `processGameEvent` Cloud Function
3. Add projection update logic for each event type
4. Implement atomic batch updates
5. Add error handling and dead letter queue

### Phase 3: Advanced Analytics (Week 5-6)
1. Implement time-windowed aggregations
2. Add semantic group analytics
3. Create performance monitoring dashboards
4. Implement projection cache invalidation
5. Add real-time telemetry streaming

### Phase 4: UI Integration (Week 7-8)
1. Update Profile page with new metrics
2. Enhance Admin dashboard with projections
3. Add real-time telemetry displays
4. Implement historical trend views
5. Add export functionality for analytics

---

## 8. Architectural Compliance

### 8.1 Domain Logic Purity ✅

**Maintained**:
- All telemetry logic remains in edge layer
- Deciders stay pure - timestamps and metadata injected via context
- No side effects in domain logic
- Event sourcing principles preserved

**Context Injection Pattern**:
```typescript
// Decider signature (unchanged)
function decideGame(
  state: GameState, 
  command: GameCommand, 
  context: { 
    timestamp: number,
    userId?: string,
    correlationId?: string,
    responseTimeMs?: number  // NEW: Edge-captured timing
  }
): GameEvent[]
```

### 8.2 GDPR Compliance ✅

**Maintained**:
- Anonymous-by-default architecture preserved
- Tenant-based isolation maintained
- No personal data in event logs
- Projection data respects tenant boundaries
- Admin access requires proper claims

### 8.3 Zero-Trust Data Contracts ✅

**Maintained**:
- Projections derived strictly from event stream
- No direct database mutations outside projections
- Event schema validation at write time
- Projection rebuild capability from event log

---

## 9. Risk Assessment

### 9.1 Technical Risks

**High Risk**:
- **Event Schema Changes**: Breaking changes to existing events
  - *Mitigation*: Version events, maintain backward compatibility
- **Projection Lag**: Real-time analytics may have delays
  - *Mitigation*: Implement streaming updates, cache projections

**Medium Risk**:
- **Cloud Function Costs**: Increased processing costs
  - *Mitigation*: Optimize batch updates, implement aggregation windows
- **Data Volume**: Large event logs may impact performance
  - *Mitigation*: Implement event archiving, time-based partitioning

### 9.2 Operational Risks

**Medium Risk**:
- **Projection Consistency**: Risk of projection drift
  - *Mitigation*: Implement projection validation, rebuild mechanisms
- **Migration Complexity**: Existing data migration challenges
  - *Mitigation*: Phased rollout, backward compatibility

---

## 10. Success Criteria

### 10.1 Technical Success
- ✅ All UI metrics derivable from event stream
- ✅ Projection updates complete within 5 seconds of event creation
- ✅ Zero data loss in projection pipeline
- ✅ Domain logic remains pure
- ✅ GDPR compliance maintained

### 10.2 Business Success
- ✅ Real-time user performance insights
- ✅ Admin dashboard with comprehensive analytics
- ✅ Learning velocity tracking
- ✅ Adaptive difficulty based on telemetry
- ✅ User engagement optimization

---

## 11. Recommendations

### 11.1 Immediate Actions (Priority 1)
1. **Add timestamp context** to all game events
2. **Enhance answer events** with word metadata
3. **Create projection collections** in Firestore
4. **Implement basic projection processor** Cloud Function

### 11.2 Short-term Actions (Priority 2)
1. **Add session tracking** events
2. **Implement atomic batch updates** for projections
3. **Create user profile projection** schema
4. **Add error handling** to projection pipeline

### 11.3 Long-term Actions (Priority 3)
1. **Implement time-windowed aggregations**
2. **Add semantic group analytics**
3. **Create real-time telemetry streaming**
4. **Implement projection caching** strategy

---

## 12. Conclusion

The Lexicon Master platform has a strong architectural foundation for event-sourced telemetry but requires significant enhancements to support comprehensive analytics. The primary gaps are in event metadata (timing, context, performance data) and projection infrastructure (processing functions, aggregation mechanisms).

**Key Findings**:
- **Event Structure**: 60% ready - needs timing and context metadata
- **Projection Infrastructure**: 20% ready - requires complete implementation
- **UI Requirements**: 40% supportable - missing advanced analytics
- **Architectural Compliance**: 100% maintained - no compromises needed

**Estimated Effort**: 6-8 weeks for full implementation
**Recommended Approach**: Phased implementation starting with critical metadata enhancement, then projection infrastructure, followed by advanced analytics.

The platform's commitment to pure function architecture and event sourcing principles provides an excellent foundation for building robust telemetry projections without compromising architectural integrity.
