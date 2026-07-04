# SCRATCHPAD

Per the Lexicon Master Architecture Manifesto, every feature implementation is
preceded by a rationale recorded here.

---

## 0001 — Project bootstrap & the "play a round" feature

**Date:** 2026-07-04
**Status:** implemented

### Goal
Stand up the Lexicon Master game on a Vite + React + TypeScript base and ship
the first playable feature: a multiple-choice dictionary quiz (see a word, pick
its definition from four candidates, score derived from play).

### Architectural rationale

- **Feature-Sliced Design.** Code is split into strict layers with a
  one-directional dependency rule (`app → pages → features → entities → shared`).
  A layer may only import from layers below it.
  - `shared/` — framework-agnostic primitives: the event bus, the event-sourcing
    store, small libs (`shuffle`, `seededRng`, `nextId`), and the UI kit.
  - `entities/` — domain: `word` (the lexicon) and `game` (events, commands,
    the pure decider + evolver, selectors). Entities do **not** import each
    other, preserving strict boundaries.
  - `features/` — `play-round`: builds a deck from words, owns the game store,
    the React provider/hooks, and the play UI.
  - `pages/` — `game`: composes the feature into a page.
  - `app/` — composition root: providers + root component + global styles.

- **Event sourcing.** State is *derived solely from an immutable event log*.
  - The UI emits **commands** (`startGame`, `submitAnswer`, `nextRound`).
  - A pure **decider** `(state, command) → events` validates intent; invalid
    commands produce no events, so the log only records legitimate transitions.
  - A pure **evolver** `(state, event) → state` folds the log into state. The
    store re-derives state from the *entire* log on every commit, making the log
    the single source of truth and replay deterministic.
  - No component mutates state directly; there is no setter, only `dispatch`.

- **Determinism.** Randomness (deck shuffling) is confined to `buildDeck`, which
  runs *before* dispatch; the resulting deck is carried in the `game/started`
  event. Given the same events, replay yields identical state. `seededRng` and
  an injectable id factory make this testable.

- **Minimal dependencies.** No state library, router, or UI framework. React +
  a hand-rolled event bus/store. Dev-only: Vite, TypeScript, oxlint, Vitest.

### Event-definition changes (per the "event-definition update" standard)
Introduced the `GameEvent` union:
`game/started`, `answer/submitted`, `round/advanced`, `game/finished`.

### Tests
Domain decider/evolver, the generic event store, the event bus, deck building,
and an end-to-end `<GameScreen>` play-through.
