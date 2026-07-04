# AGENTS.md — Lexicon Master

Operating rules for humans and Devin agents working in this repo. Derived from
the **Lexicon Master Architecture Manifesto**.

## Workflow

1. **Rationale first.** Before implementing any new feature, append a numbered
   entry to [`SCRATCHPAD.md`](./SCRATCHPAD.md) explaining the goal and the
   architectural rationale.
2. **Event definitions travel with logic.** Every business-logic change that
   introduces or alters a state transition must update the corresponding event
   definitions in `src/entities/game/model/events.ts` (and the evolver/decider).
3. Keep changes minimal and focused. Prefer editing existing slices over adding
   dependencies.

## Feature-Sliced Design (strict boundaries)

Dependency direction is one-way: `app → pages → features → entities → shared`.

- A layer may import only from layers **below** it.
- `entities` must **not** import sibling entities.
- Import from a slice's public API (`index.ts` / the `@/<layer>/<slice>` alias),
  never from its internal files.

## Event sourcing (no direct mutation)

- State is derived **solely** from the event log. There is no state setter — the
  only way to change state is to `dispatch` a command.
- The **decider** (`decide.ts`) and **evolver** (`state.ts`) must stay **pure**:
  no I/O, no randomness, no `Date.now()`. Invalid commands return `[]`.
- Confine non-determinism (randomness, clocks, ids) to the edges: `buildDeck`,
  the store's injectable clock, and `nextId`. Capture any random result in an
  event so replay stays deterministic.

## Before committing

```bash
npm run lint
npm run typecheck
npm test
```

All three must pass.
