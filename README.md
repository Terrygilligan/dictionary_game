# Lexicon Master

A multiple-choice dictionary game: you're shown a word and pick its correct
definition from four candidates. Built as a reference implementation of the
**Lexicon Master Architecture Manifesto** — Feature-Sliced Design + event
sourcing on a Vite + React + TypeScript stack, with minimal dependencies.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check + production build
npm run preview    # preview the production build
npm run typecheck  # tsc project references, no emit
npm run lint       # oxlint
npm test           # vitest (run once)
```

Node 20.9+ (or 22.12+) is required by Vite 6.

## Architecture

### Feature-Sliced Design

Strict, one-directional layers — a layer may only import from layers below it:

```
app  →  pages  →  features  →  entities  →  shared
```

| Layer      | Responsibility                                                        |
| ---------- | -------------------------------------------------------------------- |
| `shared`   | Framework-agnostic primitives: event bus, event-sourcing store, libs (`shuffle`, `seededRng`, `nextId`), UI kit. |
| `entities` | Domain: `word` (the lexicon) and `game` (events, commands, pure decider + evolver, selectors). Entities do not import each other. |
| `features` | `play-round` — deck building, the game store, React provider/hooks, and the play UI. |
| `pages`    | `game` — composes the feature into a page.                            |
| `app`      | Composition root: providers, root component, global styles.          |

Each slice exposes a public API through its `index.ts`; import from the slice
root (e.g. `@/entities/game`), not from deep internal paths.

### Event sourcing

State is **derived solely from an immutable event log**. Nothing mutates state
directly.

```
UI  --command-->  decide(state, command)  --events-->  log (append-only)
                                                          |
                          state  <--fold-- evolve(state, event)  <--+
```

- **Commands** are intents: `startGame`, `submitAnswer`, `nextRound`.
- The **decider** `(state, command) → events` is pure and validates intent;
  invalid commands yield no events.
- The **evolver** `(state, event) → state` is pure; the store re-derives state
  by folding the entire log on every commit, so the log is the single source of
  truth and replay is deterministic.
- Randomness (deck shuffling) happens in `buildDeck` *before* dispatch and is
  captured in the `game/started` event, keeping the log deterministic.

See [`SCRATCHPAD.md`](./SCRATCHPAD.md) for the per-feature rationale required by
the agentic workflow, and [`AGENTS.md`](./AGENTS.md) for contributor rules.
