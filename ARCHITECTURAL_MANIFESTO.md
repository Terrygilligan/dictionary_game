# ARCHITECTURAL_MANIFESTO.md — Lexicon Master

The unchanging "rules of the road" for the Lexicon Master app. This document contains the core architectural principles and patterns that must be maintained.

## Feature-Sliced Design (strict boundaries)

Dependency direction is one-way: `app → pages → features → entities → shared`.

- A layer may import only from layers **below** it.
- `entities` must **not** import sibling entities.
- Import from a slice's public API (`index.ts` / the `@/<layer>/<slice>` alias), never from its internal files.

## Event Sourcing (no direct mutation)

- State is derived **solely** from the event log. There is no state setter — the only way to change state is to `dispatch` a command.
- The **decider** (`decide.ts`) and **evolver** (`state.ts`) must stay **pure**: no I/O, no randomness, no `Date.now()`, no `console.log()`. Invalid commands return `[]`.
- **Context Injection Pattern**: Deciders accept `(state, command, context: { timestamp: number, userId?, correlationId? })` for external dependencies.
- Timestamps are generated at the edge (command handlers/stores) and passed via context, not inside deciders.
- Confine non-determinism (randomness, clocks, ids) to the edges: `buildDeck`, the store's injectable clock, and `nextId`. Capture any random result in an event so replay stays deterministic.

## Blind Arbiter Pattern

The game logic acts as a "blind arbiter" - it makes decisions based solely on the current state and commands, without any knowledge of:
- How the UI is implemented
- User interface details
- Presentation concerns
- External systems

This ensures the core game logic remains testable and independent of presentation concerns.

## Accessibility Requirements

- **Text-to-Speech (TTS)**: All game content must be accessible via screen readers
- **Speech-to-Text (STT)**: Voice input must be supported for game interactions
- **Keyboard Navigation**: Full keyboard accessibility without mouse dependency
- **ARIA Labels**: Proper semantic markup for screen readers

## Development Workflow

1. **Rationale first**: Before implementing any new feature, document the goal and architectural rationale
2. **Event definitions travel with logic**: Every business-logic change that introduces or alters a state transition must update the corresponding event definitions
3. **Minimal changes**: Prefer editing existing slices over adding dependencies

## Quality Gates

Before committing any changes:

```bash
npm run lint
npm run test:unit  # Pure unit tests for decider/evolver functions
npm run typecheck
npm test
```fou

All three must pass.

## Core Principles

- **FSD (Feature-Sliced Design):** `app → pages → features → entities → shared`. Strict one-way dependency. `entities` are domain-pure and may not import sibling entities.
- **Event-Sourced State:** State is derived *solely* from the event log. 
- **Pure Domain Logic:** `decide` and `evolve` functions must be 100% deterministic, pure functions (no I/O, no randomness). 
- **Blind Arbiter Pattern:** The domain state acts as an opaque container for secret information (e.g., the target word). No selector may expose private state until an explicit `reveal` event is processed.
- **Offline-First:** All data dependencies must be bundled within the app. No runtime API calls for game data.

## User Domain & Authentication

- **Event-Driven Auth:** All user state changes (registration, email verification, profile updates) must flow through the event sourcing system with proper USER_REGISTERED, USER_EMAIL_VERIFIED, and PROFILE_UPDATED events.
- **Firestore Projection:** User data is projected to Firestore using the main document structure (`users/{userId}`) rather than subcollections, with GDPR-compliant AES-256-GCM encryption applied before all writes.
- **Reactive Verification:** Email verification status changes are automatically detected via React hooks and dispatched as domain events, ensuring real-time synchronization between Firebase Auth and Firestore projections.
- **Service Account Access:** Firestore security rules allow the service account to write user projections while maintaining user privacy through proper access controls.

## Accessibility

- **TTS/STT Integration:** The app must prioritize Web Speech APIs for interaction, enabling a "Blind Arbiter" experience where the AI "Dealer" speaks and listens, rather than relying on visual text.

## NEW DEVELOPMENT DIRECTIVE: BACKEND-OFFLOADING

**Goal**: Migrate all sensitive side-effects (emails, audit logs, event processing) from client-side browser logic to Firebase Cloud Functions.

**New Rule**: If a feature requires elevated system permissions or creates a "loop" risk in the client, it must be implemented as a Cloud Function (Admin SDK).

**Client-Side Constraint**: The browser client is strictly for UI rendering and dispatching commands. It is forbidden from managing "outbox" or "queue" state beyond basic write operations.

**Maintainability Focus**: Prioritize Firebase Extensions and standard backend triggers. Do not implement complex client-side circuit breakers or retry logic if a backend trigger can handle it natively.
