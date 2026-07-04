# ARCHITECTURAL_MANIFESTO.md — Lexicon Master

The unchanging "rules of the road" for the Lexicon Master app. This document contains the core architectural principles and patterns that must be maintained.

## Feature-Sliced Design (strict boundaries)

Dependency direction is one-way: `app → pages → features → entities → shared`.

- A layer may import only from layers **below** it.
- `entities` must **not** import sibling entities.
- Import from a slice's public API (`index.ts` / the `@/<layer>/<slice>` alias), never from its internal files.

## Event Sourcing (no direct mutation)

- State is derived **solely** from the event log. There is no state setter — the only way to change state is to `dispatch` a command.
- The **decider** (`decide.ts`) and **evolver** (`state.ts`) must stay **pure**: no I/O, no randomness, no `Date.now()`. Invalid commands return `[]`.
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
npm run typecheck
npm test
```

All three must pass.

## Core Principles

- **FSD (Feature-Sliced Design):** `app → pages → features → entities → shared`. Strict one-way dependency. `entities` are domain-pure and may not import sibling entities.
- **Event-Sourced State:** State is derived *solely* from the event log. 
- **Pure Domain Logic:** `decide` and `evolve` functions must be 100% deterministic, pure functions (no I/O, no randomness). 
- **Blind Arbiter Pattern:** The domain state acts as an opaque container for secret information (e.g., the target word). No selector may expose private state until an explicit `reveal` event is processed.
- **Offline-First:** All data dependencies must be bundled within the app. No runtime API calls for game data.

## Accessibility

- **TTS/STT Integration:** The app must prioritize Web Speech APIs for interaction, enabling a "Blind Arbiter" experience where the AI "Dealer" speaks and listens, rather than relying on visual text.
