# SCRATCHPAD

**NOTE:** This file is a historical log. For architectural rules and standards, refer to **ARCHITECTURAL_MANIFESTO.md**.

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

---

## 0002 — Answer streak

**Date:** 2026-07-04
**Status:** implemented

### Goal
Track a live "streak" of consecutive correct answers, display it during play,
and expose an explicit way to reset it.

### Architectural rationale

- **Streak is derived, not stored ad-hoc.** Consistent with event sourcing, the
  streak is a projection of the event log — never mutated directly. A new
  `streak/updated` event carries the resulting streak value, and `evolveGame`
  folds it into `state.streak`. This keeps replay deterministic and auditable
  (you can see every streak change in the log).

- **Decider owns the rule.** `decideGame` computes the next streak when handling
  `submitAnswer`: a correct answer emits `streak/updated { streak: prev + 1 }`,
  an incorrect answer emits `streak/updated { streak: 0 }`. The command therefore
  produces an ordered pair of events: `answer/submitted` **then**
  `streak/updated`, so the log records the cause (the answer) before its effect
  (the streak change).

- **Explicit reset command.** `GameCommand` gains `resetStreak`, which emits
  `streak/updated { streak: 0 }` only when the streak is non-zero (no redundant
  events). `game/started` resets the streak to 0 as part of a fresh game.

### Event-definition changes
- New command: `{ type: 'resetStreak' }`.
- New event: `{ type: 'streak/updated'; streak: number }`.
- `GameState` gains `readonly streak: number` (seed `0`).

### UI
`RoundPanel` displays the current streak in its header (driven purely by the
event-derived `streak` prop). `GameScreen` passes `selectStreak(state)`.

### Tests
Extended domain tests for increment/reset and the explicit `resetStreak`
command; updated the deterministic event-sequence expectation to include the
interleaved `streak/updated` events.

---

## 0003 — Architecture of record & PWA (offline installability)

**Date:** 2026-07-04
**Status:** implemented

### Confirmed directory structure & module boundaries (source of truth)

Feature-Sliced Design with a strict, one-directional dependency rule. A layer
may import only from layers **below** it; siblings do not cross-import.

```
app  →  pages  →  features  →  entities  →  shared
```

```
src/
  app/                      composition root (no business logic)
    App.tsx                 mounts providers + the page
    providers/AppProviders  cross-cutting providers (wraps GameProvider)
    styles/index.css        global styles
  pages/
    game/GamePage           composes the play-round feature into a page
  features/
    play-round/
      model/                buildDeck, gameStore (dispatch), GameProvider,
                            context, useGame hooks
      ui/                   GameScreen, StartPanel, RoundPanel, ResultPanel
  entities/
    word/                   Word type + in-repo lexicon dataset
    game/                   pure domain: types, commands, events, decide,
                            evolve (state), selectors  (no sibling imports:
                            game must NOT import word)
  shared/
    event-bus/              generic pub/sub (createEventBus)
    event-sourcing/         createEventStore: commit → re-derive from log
    lib/                    shuffle, seededRng, nextId
    ui/                     Button
    test/                   vitest setup
```

**Boundary rules enforced:**
- Each slice exposes a public API via its `index.ts`; consumers import the slice
  root through the `@/<layer>/<slice>` alias, never deep internal paths.
- `entities/game` and `entities/word` are independent; combining them (deck
  building) lives in the `play-round` feature, which is allowed to depend on
  both entities.
- Only `features`/`app` may hold non-determinism (rng, clock, id, service-worker
  registration). Domain `decide`/`evolve` stay pure.

> Note: this structure was realised in PR #1 (entries 0001–0002). Entry 0003
> documents it as the architecture of record and adds the PWA layer below.

### PWA — rationale

Goal: make Lexicon Master installable and playable offline.

- **Zero new dependencies (hand-rolled).** Consistent with the "minimal
  dependencies" standard and the custom event-bus precedent, the PWA is built
  from platform primitives — a `manifest.webmanifest` and a service worker —
  rather than a build plugin.
- **App shell + runtime caching.** `public/sw.js` precaches the app shell on
  `install`, cleans stale caches on `activate`, and serves `fetch`es with:
  navigations → network-first (fall back to cached `index.html` offline);
  same-origin static assets (Vite's hashed JS/CSS) → stale-while-revalidate.
  Runtime caching means the SW needs no build-generated precache list, so it
  stays a static, dependency-free file.
- **Layering.** The service worker is an `app`-layer concern. Registration lives
  in `app` bootstrap (`src/app/pwa/registerSW.ts`, called from `main.tsx`) and
  runs in **production only** to avoid caching interfering with dev/HMR. The
  domain and event-sourcing core are untouched.
- **Icons/manifest** live in `public/` (served at root): generated 192/512 PNG
  icons (`any` + `maskable`), theme/background colours matched to the UI.

### Files added
`public/manifest.webmanifest`, `public/sw.js`, `public/pwa-192.png`,
`public/pwa-512.png`, `public/pwa-maskable-512.png`, `src/app/pwa/registerSW.ts`;
`index.html` gains manifest + theme-color links; `.oxlintrc.json` ignores the
service worker (worker globals, non-module).
