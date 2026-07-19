# Lexicon Master: Immersion Engine Roadmap

**Current Status**: Architectural Foundation Verified  
**Goal**: Bidirectional, Spaced-Repetition Language Acquisition Platform

---

## 🏗️ Phase 1: Data Architecture (The "Manifest" Core)

**Goal**: Move from "word lists" to a "structured curriculum."

### 1.1 Schema Hardening
- Finalize `vocabulary.manifest.json` with:
  - `milestone_id` - Curriculum progression identifier
  - `word_type` - Categorization (noun, verb, adjective, etc.)
  - `sentence_frame` - Contextual usage examples

### 1.2 Seeder Logic
- Implement Admin-SDK-backed seeder that:
  - Dispatches `addWordDefinition` commands to entity deciders
  - Maintains event-sourced integrity (no direct database writes)
  - Includes proper tenant_id and aggregate_id in all commands

### 1.3 Entity Expansion
- Update `entities/user/model` to understand:
  - Milestone progress tracking
  - Proficiency scores per milestone
- Update `entities/game/model` to understand:
  - Milestone-based content selection
  - Proficiency-aware game mechanics

---

## 🧠 Phase 2: The Immersion Engine (The "Brain")

**Goal**: Build the algorithmic core that mimics human language learning.

### 2.1 Spaced Repetition Decider
- Refactor game engine to mix milestone_id content:
  - 70% current-milestone (learning new material)
  - 30% previous-milestones (review for retention)
- Implement as pure domain logic in decider
- No randomness in domain - receive seeded values from feature layer

### 2.2 Proficiency Gatekeeper
- Implement logic where Decider rejects `StartRound` commands if:
  - Proficiency score for current milestone is below threshold
  - User hasn't mastered prerequisite concepts
- Maintain command validation pattern
- Emit `proficiency_gate_rejected` events for audit trail

### 2.3 Bidirectional Presenter
- Build UI abstraction layer that switches between:
  - Word-to-Definition mode
  - Definition-to-Word mode
- Based on `game_mode` command from domain layer
- Respect FSD boundaries (UI in features, logic in entities)

---

## 📊 Phase 3: Audit & Mastery (The "Feedback Loop")

**Goal**: Give the user (and the SuperAdmin) insight into the learning process.

### 3.1 Proficiency Projection
- Create new projection that maps:
  - User's events → `mastery_map`
  - Tracks which words/milestones they have conquered
- Read-only projection (no mutation of source events)
- Tenant-isolated queries

### 3.2 Drift-Resistant Reporting
- Update AuditDashboard to visualize:
  - "Time-to-Mastery" per milestone
  - Proficiency progression over time
  - Learning velocity metrics
- Leverage existing Event Auditor Service

### 3.3 Integrity Checks
- Add automated event-replay tests to ensure:
  - Every "mastery" status is derived from verified events
  - No UI state manipulation without event backing
  - Drift detection for proficiency calculations

---

## Architectural Validation

### Phase 1: Data Architecture ✅
- Schema hardening with milestone_id and proficiency_scores aligns perfectly with event-sourced approach
- Admin-SDK seeder dispatching commands to entity deciders maintains pure domain pattern
- Entity expansion for milestones/proficiency preserves FSD boundaries

### Phase 2: Immersion Engine ✅
- Spaced repetition decider (70/30 mix) is pure domain decision - perfect for decider pattern
- Proficiency gatekeeper as command validation in decider maintains event-sourcing integrity
- Bidirectional presenter as UI abstraction layer respects FSD (features → entities)

### Phase 3: Audit & Mastery ✅
- Proficiency projection as read-only view aligns with Audit Service pattern
- Drift-resistant reporting leverages the event auditor we built
- Integrity checks via event-replay tests validate core architectural principle

## Architectural Compliance

The roadmap respects all architectural constraints:

- ✅ **Event-Sourced**: All state changes via commands/events
- ✅ **FSD Boundaries**: Clear separation between data/domain/presentation
- ✅ **Multi-Tenant**: tenant_id/aggregate_id maintained throughout
- ✅ **Read-Only Auditing**: Projections don't mutate source
- ✅ **Command Identity**: All commands include explicit identity metadata
- ✅ **Pure Domain Logic**: Decider/evolver remain deterministic
- ✅ **No Context Dependencies**: Domain logic receives identity via commands

## Strategic Recommendation

**Suggested Starting Point**: Phase 1 is the logical foundation. The schema and entity changes enable Phase 2's algorithmic core, which then feeds Phase 3's visibility.

## Implementation Sequence

When ready to begin:

1. **Phase 1.1**: Schema hardening of vocabulary.manifest.json
2. **Phase 1.2**: Admin-SDK seeder implementation  
3. **Phase 1.3**: Entity expansion for milestones/proficiency
4. **Phase 2.1**: Spaced repetition decider
5. **Phase 2.2**: Proficiency gatekeeper
6. **Phase 2.3**: Bidirectional presenter
7. **Phase 3.1**: Proficiency projection
8. **Phase 3.2**: Drift-resistant reporting
9. **Phase 3.3**: Integrity checks

## Dependencies

```
Phase 1 (Data) → Phase 2 (Engine) → Phase 3 (Audit)
     ↓                ↓                  ↓
  Schema        Algorithms          Visibility
  Entities      Decider Logic       Projections
  Commands      Gatekeeper          Integrity
```

## Success Metrics

- **Phase 1**: Structured curriculum with milestone progression
- **Phase 2**: Adaptive learning engine with spaced repetition
- **Phase 3**: Complete visibility into learning journey with integrity guarantees

---

**Last Updated**: 2026-07-17  
**Branch**: feature/event-auditor  
**Status**: Roadmap Defined, Ready for Implementation
