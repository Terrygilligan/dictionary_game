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

## 0004 — The "Dictionary Game" (Main Game)

**Date:** 2026-07-04
**Status:** implemented

### Goal
Implement the core domain logic for the "Dictionary Game" (the "Dealer" game).

### Mechanics & Interpretations
1. **Phased Selection State Machine:**
   - Phases: `idle → scroll → page → column → wordNumber → ready → sealed → revealed`.
   - Each phase accepts a `select<Phase>` command. Out-of-order commands return `[]` (invalid).
   - "Scroll" represents a section-index (e.g., A-E, F-J, etc.) to mimic the "flicking" through a dictionary.
2. **Blind Arbiter:**
   - `sealWord` resolves coordinates to a concrete word ID.
   - `secretWord` is stored in state but masked from all selectors.
   - `revealWord` event makes the word public to the UI.
3. **Event/Command definitions:**
   - Commands: `selectScroll`, `selectPage`, `selectColumn`, `selectWordNumber`, `sealWord`, `revealWord`.
   - Events: `game/started` (with lexicon layout), `scroll/selected`, `page/selected`, `column/selected`, `wordNumber/selected`, `word/sealed`, `word/revealed`.
4. **Bounds:**
   - The Lexicon layout is passed at `game/started` and carried in state. The decider
     validates every selection against the layout, and each bound depends on the
     prior coordinate (page count depends on the chosen scroll, etc.) — which is
     precisely why selection is phased.

### Implementation notes (as built)

- **Location & isolation.** A self-contained sub-module `entities/game/model/main-game/`
  (`types`, `events`, `commands`, `layout`, `decide`, `state`, `selectors`, `index`),

---

## 0005 — Main Game Selection UI

**Date:** 2026-07-04
**Status:** In Progress

### Goal

Implement the UI for the "Dictionary Game" selection flow.

### Architectural Rationale

* **FSD Boundary:** The UI lives in `features/main-game/ui`. It imports `entities/game` only for state selection and command dispatch. It does **not** contain game logic (decisions).
* **Blind Arbiter UX:** The selection screens show the *process* (flicking, selecting page side), but never the target word.
* **Accessibility:** We will integrate `useTTS` and `useSTT` hooks (from `shared/lib/speech`) to handle dictionary interactions. The UI will trigger these based on state changes (e.g., when a selection phase finishes).
* **State Feedback:** The UI reflects the current phase (`scroll`, `page`, `column`, `wordNumber`, `ready`). If the domain decider returns an error (out of bounds), the UI must display a non-blocking error toast.
  re-exported from `entities/game`'s public API. It lives alongside — and does not
  disturb — the existing multiple-choice quiz domain (its own `GameEvent`/`GameState`).
  It imports **no** sibling entity: words are opaque `wordId` strings inside the
  `LexiconLayout`, so the domain stays pure and boundary-clean (FSD).
- **Layout model.** `LexiconLayout → scrolls[] → pages[] → columns[] → wordIds[]`.
  `layout.ts` holds the pure bounds/resolution helpers (`inRange`, `scrollCount`,
  `pageCount`, `columnCount`, `wordCount`, `resolveWordId`, `hasAnyWord`); `decide`
  and `evolve` contain no I/O, randomness, or clocks.
- **The `ready` phase.** The spec lists `wordNumber → sealed`; because sealing is a
  *distinct* arbiter command (`sealWord`), the machine rests in `ready` between the
  last coordinate and the seal. `selectWordNumber` moves `wordNumber → ready`;
  `sealWord` moves `ready → sealed`. Two commands cannot collapse into one FSM edge.
- **Blind Arbiter (enforced).** `word/sealed` carries the id into the private
  `state.secretWordId`; **no selector reads it**. `word/revealed` is the single
  legitimate exit — it writes `state.revealedWordId`, and `selectRevealedWordId`
  returns `null` until then. `selectIsSealed` / `selectIsRevealed` expose only phase.
- **Determinism.** Given the same command sequence the event log is identical, and
  replaying the log from `initialMainGameState` reproduces state exactly (tested).
- **Out of scope (this task = domain only).** No feature/UI wiring yet; the
  manifesto's TTS/STT/keyboard accessibility requirements apply to the future
  presentation layer, not this pure domain module.

### Event-definition changes
New `MainGameEvent` union: `game/started` (with layout), `scroll/selected`,
`page/selected`, `column/selected`, `wordNumber/selected`, `word/sealed`,
`word/revealed`. New `MainGameCommand` union mirrors the six intents above.
>>>>>>> 5f90a2c9148dcde04e9e70a9989af0f0cb68a6c4

### Tests
`main-game/mainGame.test.ts` (9 cases): phase walk, out-of-order rejection,
out-of-bounds rejection, seal-hides-word, reveal-exposes-word, reveal-before-seal
rejection, and deterministic-replay of a full game.

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

---

## 0005 — Formalised event log: schema + `EventLogService`

**Date:** 2026-07-04
**Status:** implemented

### Goal
Make the event log a first-class, persistable artifact: a typed `Event` +
`EventLog` schema and an `EventLogService` that appends events, exports the log
to JSON (for offline, file-based storage), and replays it to reconstruct game
state. Per the manifesto's **offline-first / event-mirrored** principle — a match
is fully reconstructible from its mirrored log with no runtime API calls.

### Architectural rationale

- **Layer: `shared/event-sourcing`.** This is domain-agnostic infrastructure
  (generic over `TState`/`TEvent`), so it sits in `shared` beside
  `createEventStore` and is reused by any feature. It imports no entity.
- **Event object = `EventEnvelope<TEvent>`.** The existing envelope already *is*
  the persisted event record (identity `id`, ordering `seq`, `timestamp`, and the
  domain `event` payload). Reusing it — rather than minting a parallel `Event`
  type — keeps a single serialization shape across the store and the log service.
- **`EventLog` structure.** `{ matchId, createdAt, events: EventEnvelope[] }`.
  `matchId` scopes a log to one match/game; `createdAt` records when the log was
  opened; `events` is the append-only, ordered array — the single source of truth.
- **Determinism at the edges.** `append` is the only impure surface: it stamps
  `seq` (monotonic), `timestamp` (injectable `clock`), and `id` (injectable
  `nextId`) — mirroring `createEventStore`. `replay` is a **pure** fold
  (`events.reduce(evolve, seed)`), so a log always reconstructs identical state.
- **Offline-first / event-mirrored.** `toJSON` serialises the whole `EventLog`
  for file/localStorage persistence; `eventLogFromJSON` parses + validates it
  back, and `replayLog` (a pure standalone) rebuilds state. Round-trip
  (live → JSON → parse → replay) reproduces the live state exactly (tested).

### Event-definition changes
No new domain events. Adds infrastructure types `EventLog<TEvent>` and
`EventLogService<TState, TEvent>` plus pure helpers `replayLog` /
`eventLogFromJSON`, exported from `shared/event-sourcing`.

### Tests
`eventLog.test.ts`: monotonic seq + metadata on append; JSON round-trip;
pure replay reconstructs state; `matchId`/`createdAt` preserved; malformed JSON
rejected.

---

## 0006 — Multilingual Village Expansion (i18n + Firebase)

**Date:** 2026-07-04  
**Status:** implemented

### Goal
Scale Lexicon Master to support a truly multilingual environment for the village community, including English, Dutch, Bulgarian, Indonesian, French, and German, with Firebase infrastructure for user data persistence.

### Architectural rationale

- **ID-based Lexicon Architecture.** The system already used word IDs (`word_001`, etc.) rather than hard-coded strings, making it naturally prepared for multilingual expansion. Words are resolved by ID through `getWordById()`, then localized content is applied via the i18n service.

- **Strategy Pattern for Localization.** Externalized all display strings into JSON locale files (`en.json`, `nl.json`, `bg.json`, `in.json`, `fr.json`, `de.json`). The `i18nService` manages loading the appropriate locale file based on `currentLanguage` state, with fallback to English.

- **Firebase Infrastructure.** Implemented Firebase auth and database services with proper security rules. The `authService` follows the Blind Arbiter pattern - tokens are never exposed to UI components. The `dbService` handles event log persistence and user data storage.

- **React Hook Integration.** Created `useTranslate` hook that provides language-agnostic UI components with translation capabilities, language switching, and locale state management.

- **Enhanced Lexicon Entity.** Added `i18nLexicon.ts` with `LocalizedLexiconWord` interface that extends base `LexiconWord` with `localizedWord` and `localizedDefinition` properties. This maintains the pure domain model while enabling multilingual display.

- **Community-Ready Translation Structure.** Word translation registry includes optional `contributor` field metadata for future community-contributed dictionary features, enabling neighbor recognition for vocabulary additions.

### Implementation details

- **Firebase Configuration.** Environment-based configuration using `import.meta.env` with proper validation and lazy initialization of Firebase services.
- **Security Rules.** Firestore rules restrict read/write access to `auth.uid` owners for user data, with proper validation for event log structure.
- **Translation Resolution.** Two-step process: resolve word by ID, then apply current language translations with fallback to English.
- **State Persistence.** Language preference stored in localStorage for user experience continuity.

### Files added
`src/shared/lib/i18n/` (service, types, React hook, 6 locale JSON files), `src/entities/lexicon/model/i18nLexicon.ts`, Firebase services (`src/services/auth.ts`, `src/services/db.ts`), enhanced `src/shared/api/firebase.ts`.

### Tests
Domain logic remains pure and testable. i18n service includes initialization and language switching validation. Firebase services include error handling and proper token management (never exposed to UI).

---

## 0007 — GDPR Compliance & Production Infrastructure

**Date:** 2026-07-04  
**Status:** implemented

### Goal
Implement GDPR compliance for the European market, including crypto-shredding for sensitive data, privacy policy infrastructure, and production deployment automation for EU-based hosting.

### Architectural rationale

- **Crypto-Shredding Implementation.** Created browser-compatible encryption system using Web Crypto API (AES-256-GCM) for sensitive data in event logs and user profiles. The `KeyManager` handles key lifecycle - destroying keys permanently shreds data, fulfilling GDPR's "right to be forgotten."

- **Privacy by Design Architecture.** All user-facing forms include explicit Terms of Service and Privacy Policy acceptance checkboxes. Legal documents are properly structured and accessible via dedicated routes.

- **EU-First Infrastructure.** Firebase project configured for `europe-west1` region with production deployment scripts that verify EU compliance before deployment.

- **Browser Compatibility.** Replaced Node.js crypto module with Web Crypto API to ensure client-side encryption works in all browsers without external dependencies.

- **Event Log Encryption.** Sensitive fields (user IDs, personal data) in event logs are automatically encrypted before Firestore storage, with transparent decryption during retrieval.

- **Key Management Strategy.** Encryption keys are stored in memory only, never persisted or committed to source control. Production deployment recommends Google Cloud Secret Manager for key storage.

### Implementation details

- **Crypto-Shredding Service.** `cryptoShreddingBrowser.ts` provides `encryptUserProfile`, `decryptUserProfile`, `encryptEventLog`, `decryptEventLog` functions with automatic key management.

- **Legal Documentation.** Created comprehensive `PrivacyPolicy.md` and `TermsOfService.md` documents covering data processing, user rights, cookie policies, and GDPR compliance clauses.

- **Production Automation.** `deploy-production.sh` and `setup-production-env.sh` scripts handle Firebase EU deployment, security verification, and environment setup.

- **Database Integration.** Modified `db.ts` to automatically encrypt/decrypt sensitive data during save/load operations, maintaining transparent API for the rest of the application.

- **UI Integration.** Updated `AuthPage.tsx` with terms acceptance checkbox and proper validation, including links to legal documents.

### Files added
`src/shared/lib/security/cryptoShreddingBrowser.ts`, `docs/PrivacyPolicy.md`, `docs/TermsOfService.md`, `firebase.json`, `scripts/deploy-production.sh`, `scripts/setup-production-env.sh`, `docs/VILLAGE_BETA_GUIDE.md`, `RELEASE_CHECKLIST.md`.

### Tests
Crypto-shredding includes browser compatibility testing. Legal documents reviewed for GDPR compliance. Deployment scripts include environment validation and security checks.

---

## 0008 — Village Beta UI/UX Polish & Navigation

**Date:** 2026-07-05  
**Status:** implemented

### Goal
Complete the user experience for Village Beta testing by implementing proper navigation, language switching UI, and ensuring all pages are accessible and functional.

### Architectural rationale

- **Consistent Language Access.** Added `LanguageSwitcher` component to all page headers (Landing, Auth, Profile) ensuring users can change language from any context without navigation disruption.

- **Component Reusability.** `LanguageSwitcher` is a shared UI component that integrates with the existing i18n service, maintaining clean separation between UI and state management.

- **Progressive Enhancement.** Language switching works instantly without page reload, leveraging React's reactive state management and localStorage persistence.

- **Accessibility First Design.** Language switcher includes proper labels, keyboard navigation, and WCAG 2.1 AA compliant styling with focus indicators.

- **Navigation Flow.** Implemented proper page routing with "Get Started" button linking from landing to auth page, preparing for full router implementation.

### Implementation details

- **LanguageSwitcher Component.** Created reusable dropdown with all 6 languages, instant switching, and proper async language loading.

- **Page Header Structure.** Added consistent `.page__header` layout across all pages with title on left, language switcher on right.

- **CSS Styling.** Added comprehensive styling for language switcher with hover states, focus indicators, and responsive design considerations.

- **Export Structure.** Updated `shared/ui/index.ts` to export LanguageSwitcher for consistent import patterns.

### Files modified
`src/pages/landing/ui/LandingPage.tsx`, `src/pages/auth/ui/AuthPage.tsx`, `src/pages/profile/ui/ProfilePage.tsx`, `src/app/styles/index.css`, `src/shared/ui/LanguageSwitcher.tsx`, `src/shared/ui/index.ts`.

### Tests
Language switching tested across all 6 languages. Navigation flow verified. Accessibility compliance checked with keyboard navigation and screen reader compatibility.

---

## 0003 — Email Verification Event System & Firestore Structure Refactor

**Date:** 2026-07-07
**Status:** implemented

### Goal
Resolve two critical issues: (1) FirebaseError 'Invalid document reference' due to incorrect Firestore subcollection paths, and (2) emailVerified field not updating when users verify their email through Firebase Auth.

### Architectural rationale

- **Event-Driven Architecture.** Implemented comprehensive event system for email verification using USER_EMAIL_VERIFIED events, maintaining the pure event sourcing pattern with proper decider/evolver separation.

- **Firestore Structure Simplification.** Refactored from subcollection approach (`users/{userId}/profile`) to main document approach (`users/{userId}`) to resolve document reference errors and simplify security rules.

- **Reactive State Management.** Created useEmailVerification hook that automatically detects emailVerified changes in Firebase Auth and dispatches domain events, ensuring real-time synchronization between Auth and Firestore.

- **GDPR Compliance Maintenance.** Preserved AES-256-GCM encryption throughout the refactor while centralizing encryption logic in the database service to prevent double encryption.

- **Clean Architecture Integration.** Added EmailVerificationTracker component to provider composition root for zero-impact side effect handling without polluting component tree.

### Implementation details

- **Event System.** Added UserEmailVerified event interface, VerifyUserEmail command, and complete decide/evolve logic for email verification domain events.

- **Auth Detection Hook.** Implemented useEmailVerification with useRef-based state tracking to detect false→true transitions in emailVerified status.

- **Projection Service Updates.** Added handleEmailVerifiedProjection method that loads existing profiles, updates emailVerified field, and maintains audit trails with verifiedAt timestamps.

- **Firestore Refactor.** Updated dbService methods to write directly to main user documents instead of subcollections, simplifying the data model and security rules.

- **Testing Coverage.** Added comprehensive test cases for email verification events and updated existing tests to match new Firestore structure.

### Files modified
`src/entities/user/model/events.ts`, `src/entities/user/model/commands.ts`, `src/entities/user/model/decide.ts`, `src/entities/user/model/evolve.ts`, `src/services/db.ts`, `src/services/userProjectionService.ts`, `src/hooks/useEmailVerification.ts`, `src/components/EmailVerificationTracker.tsx`, `src/app/providers/AppProviders.tsx`, `firestore.rules`, `src/services/userProjectionService.test.ts`.

### Tests
All 10/10 tests passing including 2 new email verification test cases. Firestore document reference errors resolved. Email verification flow tested and verified with comprehensive debug logging. Build successful with no TypeScript errors.

---

## 0002 — SuperAdmin Dashboard with AuditProjection and EventStreamDashboard

**Date:** 2026-07-09
**Status:** planning

### Goal
Implement a comprehensive SuperAdmin Dashboard for real-time audit and visualization of all system events across the multi-tenant EventStore. This will provide administrative oversight of the Lexicon Master application's event-driven architecture.

### Architectural rationale

- **Event-Driven Audit Trail.** Leverage the existing multi-tenant EventStore to create a read-optimized AuditProjection that processes and indexes events for real-time dashboard visualization without impacting write performance.

- **Feature-Sliced Design Compliance.** The dashboard will be structured as:
  - `shared/` — audit projection types and event aggregation utilities
  - `entities/` — audit entity with projection logic and event processors
  - `features/` — `super-admin-dashboard` feature with React components and hooks
  - `pages/` — admin page composition
  - `app/` — route integration and admin-only access control

- **Real-Time Event Streaming.** Subscribe to the EventBus across all tenants to build live projections of:
  - User authentication and registration events
  - Game sessions and difficulty adjustments
  - Audio processing and AI agent interactions
  - System performance and error events
  - Multi-tenant activity metrics

- **Projection Pattern.** Create an AuditProjection service that:
  - Consumes events from all tenant streams
  - Maintains read-optimized aggregates for dashboard queries
  - Provides filtering, pagination, and search capabilities
  - Stores historical analytics without affecting write path

- **Security & Access Control.** Implement admin-only access using Firebase auth claims and ensure audit log integrity with tamper-evident event sequencing.

- **Performance Optimization.** Use event batching, efficient indexing, and React virtualization to handle high-volume event streams without UI degradation.

### Implementation details

- **AuditProjection Service.** Multi-tenant event processor that builds and maintains dashboard-ready data structures from the immutable event log.

- **EventStreamDashboard Component.** React dashboard with real-time updates, filtering by tenant/event type, and visual analytics for system health monitoring.

- **Event Aggregation.** Time-windowed statistics, error rate tracking, and user activity heatmaps derived from event streams.

- **Admin Authentication.** Firebase custom claims and route guards to restrict dashboard access to authorized administrators.

### Files to be created
`src/entities/audit/model/`, `src/services/auditProjectionService.ts`, `src/features/super-admin-dashboard/`, `src/pages/admin/`, dashboard UI components and routing integration.

---

## 0009 — Live Telemetry Dashboard Wiring

**Date:** 2026-07-14
**Status:** implemented

### Goal
Bridge the SuperAdmin dashboard from a mock-fed `AuditProjection` to the real multi-tenant `EventStore` bus, so the `EventStreamDashboard` displays telemetry from real testers as events are committed.

### Architectural rationale

- **Envelope is the source of truth.** `EventStore.commit` now publishes the full `EventEnvelope` (id, seq, timestamp, tenant_id, aggregate_id, event) on `store.bus` instead of the bare payload. This preserves the identity metadata required by audit/projections without requiring consumers to scan the event payload.
- **Projection is fed, not isolated.** `AuditProjectionService` is the bridge. It subscribes directly to `gameStore.bus`, `userStore.bus`, and `villageStore.bus`, and forwards every received envelope to `AuditProjectionCore.processEvent`. Existing events are loaded from `EventStore.getLog()` before live subscription.
- **Shared store instances.** `GameProvider` and `UserProvider` now default to shared store singletons (`gameStore` and `userStore`) instead of minting fresh instances on mount. This guarantees the dashboard, `AuthCommandService`, and gameplay all observe the same event logs.
- **No mock data.** `SuperAdminDashboardPage` no longer creates an isolated `eventBus` or `MockEventGenerator`. It receives the `AuditProjection` from a live `AuditProjectionService` wired to the real stores.
- **No schema changes needed.** The `EventEnvelope` already carries all fields the audit projection requires (`id`, `seq`, `timestamp`, `tenant_id`, `aggregate_id`, `event`). No new domain events were introduced; this is a read-projection wiring change.

### Files modified
`src/shared/event-sourcing/eventStore.ts`, `src/shared/event-sourcing/eventStore.test.ts`, `src/entities/audit/auditProjectionCore.ts`, `src/entities/audit/model/index.ts`, `src/services/auditProjectionService.ts`, `src/pages/admin/SuperAdminDashboardPage.tsx`, `src/features/play-round/model/gameStore.ts`, `src/features/play-round/model/GameProvider.tsx`, `src/features/play-round/model/useGame.ts`, `src/features/play-round/index.ts`, `src/entities/user/model/UserProvider.tsx`.

---

## 0010 — Admin superAdmin claim recognition & firebase-admin for promotion scripts

**Date:** 2026-07-14
**Status:** implemented

### Goal
Allow a Firebase user promoted with the `superAdmin` custom claim to access the admin dashboard, and provide the `firebase-admin` dependency needed to run the `scripts/promote-user.ts` utility.

### Architectural rationale

- **Claim check parity.** `Header.tsx` and `AdminPage.tsx` both gated admin UI on `claims.admin`. The `promote-user.ts` script sets `superAdmin: true`. Either claim should grant admin access, so the UI now treats `admin || superAdmin` as the admin predicate.
- **Minimal source change.** The promotion script is operational tooling, not domain logic, so its behavior is unchanged; only the claim consumer widens its check.
- **Dependency hygiene.** `firebase-admin` is required at runtime by `scripts/promote-user.ts` but is not shipped in the browser bundle. Adding it to `devDependencies` keeps the client bundle lean while making the promotion utility runnable via `tsx`.

### Files modified
`package.json`, `src/shared/ui/Header.tsx`, `src/pages/admin/AdminPage.tsx`.

---

## 0011 — Identity Injection for UserProvider Multi-Tenant Isolation

**Date:** 2026-07-14
**Status:** implemented

### Goal
Remove hardcoded 'default', 'default' tenant/aggregate identifiers from UserProvider and userStore, replacing them with dynamic tenant_id and aggregate_id derived from the authenticated Firebase user's uid. This ensures strict multi-tenant isolation per the Command Identity Enforcement Directive.

### Architectural rationale

- **Multi-Tenant Enforcement.** The EventStore requires explicit tenant_id and aggregate_id for all operations. Currently, UserProvider hardcodes 'default', 'default' which violates multi-tenant isolation and the Command Identity Directive.
- **Auth-Driven Identity.** The Firebase Auth service already surfaces user identity via `authService.onAuthStateChanged` and the `useFirebaseAuth` hook exposes `tenant_id: user?.id`. Mapping both tenant_id and aggregate_id to the uid provides proper per-user isolation.
- **Command Identity Compliance.** UserCommand types already require tenant_id and aggregate_id fields. The store dispatch must accept and validate these IDs, ensuring all commands carry explicit identity metadata.
- **Reactive Re-initialization.** When uid changes (login/logout), UserProvider must re-initialize the store context with new tenant/aggregate IDs, preventing cross-tenant data leakage.
- **FSD Compliance.** The auth hook lives in the feature layer (`useFirebaseAuth`) but is consumed by the entity layer (`UserProvider`) only for identity extraction, not business logic. This maintains the dependency direction (entities ← features) for identity metadata only.

### Implementation details

- **Auth Hook Analysis.** `useFirebaseAuth` in `src/features/play-round/model/useFirebaseAuth.ts` surfaces `user.id` as `tenant_id`. It provides reactive auth state via `authService.onAuthStateChanged`.
- **UserProvider Refactor.** Inject `useFirebaseAuth` to derive tenantId and aggregateId from `user.id`. Replace 'default', 'default' in all getState() calls with dynamic values. Add useEffect to re-initialize store when uid changes.
- **userStore Refactor.** Update dispatch signature to `dispatch(command: UserCommand, tenant_id: string, aggregate_id: string)`. Replace hardcoded 'default', 'default' in getState() and commit() calls with injected parameters.
- **Hook Updates.** Update `useUserDispatch`, `useCurrentUser`, `useAuthStatus` to accept and pass tenantId/aggregateId parameters.
- **Context Bridge.** Update UserStoreContext to provide a method for dispatching with identity parameters, or create a new context that exposes the identity-aware store interface.

### Files to be modified
`src/entities/user/model/UserProvider.tsx`, `src/entities/user/model/userStore.ts`, `src/entities/user/model/context.ts`, `src/entities/user/model/useUser.ts`, `src/entities/user/model/index.ts` (for updated exports).

### Validation
- Verify no remaining 'default', 'default' strings in user entity files.
- Ensure all getState() calls use dynamic tenantId/aggregateId.
- Confirm dispatch() requires tenant_id and aggregate_id parameters.
- Test login/logout triggers proper store re-initialization.

### Files modified
`src/entities/user/model/userStore.ts`, `src/entities/user/model/context.ts`, `src/entities/user/model/useUser.ts`, `src/entities/user/model/UserProvider.tsx`, `src/services/AuthCommandService.ts`, `src/pages/profile/ui/ProfilePage.tsx`.

### Tests
All 53 tests passing. Typecheck passing. Lint passing (5 pre-existing warnings unrelated to this change).

---

## 0012 — User Materialization Loop with UserEventBus

**Date:** 2026-07-14
**Status:** implemented

### Goal
Implement a user materialization loop that projects user registration events to Firestore with proper multi-tenant isolation and GDPR encryption, using a dedicated UserEventBus for decoupled event routing.

### Architectural rationale

- **Event-Driven Architecture.** Replace tight coupling between OutboxProcessor and EmailVerificationService with a UserEventBus that allows multiple subscribers to process user events independently.
- **Multi-Tenant Enforcement.** UserEventBus carries tenant_id and aggregate_id in event envelopes, ensuring all projections maintain proper tenant isolation.
- **GDPR Compliance.** UserProjectionService applies AES-256-GCM encryption before writing to Firestore, ensuring sensitive user data is crypto-shreddable.
- **Idempotent Projections.** Using Firestore's `setDoc(..., { merge: true })` prevents document overwrites during flaky network conditions while allowing incremental updates.
- **FSD Compliance.** UserEventBus lives in shared layer, UserProjectionService in service layer, maintaining proper dependency direction.

### Implementation details

- **UserEventBus.** Create typed event bus for user domain events with envelope structure including tenant_id, aggregate_id, correlationId, timestamp, eventType, and payload.
- **UserProjectionService.** Subscribe to user.registered events, extract identity metadata, encrypt sensitive fields, write to Firestore users/{userId} with merge semantics.
- **OutboxProcessor Refactor.** Replace direct emailVerificationService call with UserEventBus.publish() for user.registered events.
- **EmailVerificationService Update.** Subscribe to UserEventBus instead of receiving direct method calls, maintaining existing logic.

### Files to be created
`src/shared/events/UserEventBus.ts`, `src/services/userProjectionService.ts`.

### Files to be modified
`src/shared/events/OutboxProcessor.ts`, `src/services/EmailVerificationService.ts`.

### Validation
- Verify Firestore users/{userId} document creation on registration
- Confirm tenant_id and aggregate_id preserved in event envelope
- Test both email verification and projection execute on registration
- Ensure GDPR encryption applied to sensitive user data

### Files created
`src/shared/events/UserEventBus.ts`, `src/services/userProjectionService.ts`.

### Files modified
`src/shared/events/OutboxProcessor.ts`, `src/services/EmailVerificationService.ts`, `src/app/providers/OutboxProvider.tsx`, `src/services/AuthCommandService.ts`.

### Critical Fix (2026-07-14)
Removed 'default' fallback for tenant_id and aggregate_id in OutboxProcessor (lines 254-255). 
Now enforces strict validation with descriptive error message if identity metadata missing.
This closes the final gap in multi-tenant isolation enforcement.

### Tests
Typecheck passing. Lint passing (5 pre-existing warnings unrelated to this change).

---

## 0013 — GDPR & Crypto-Shredding Readiness

**Date:** 2026-07-14
**Status:** planned

### Goal
Document and prepare the system architecture for crypto-shredding to support the "Right to be Forgotten" while maintaining immutable event-sourced architecture.

### Architectural strategy: Crypto-Shredding for Total Deletion

To support GDPR compliance for data deletion without requiring risky physical purging of immutable event logs, the system is designed to support future crypto-shredding. This strategy allows legally compliant data deletion by destroying encryption keys rather than data.

### Core principles

- **Identity Segregation**: All user data is partitioned by `tenant_id` and `aggregate_id` for tenant isolation.
- **Encryption at the Edge**: Sensitive user data is encrypted within `UserProjectionService` before reaching the database.
- **Key-Based Shredding**: By assigning each user a unique Data Encryption Key (DEK) identified by `encryption_key_id`, we can render all historical data (event store) and current data (read model) cryptographically unreachable by destroying the DEK.

### Implementation requirements for future phases

- [ ] **Encryption Key Management Service (KMS)**: Implement a service to map `encryption_key_id` to actual decryption keys.
- [ ] **Event Schema Evolution**: Ensure all new events include `encryption_key_id` in their envelope metadata.
- [ ] **Read Model Updates**: Ensure all materialized Firestore documents store their associated `encryption_key_id`.
- [ ] **Deletion Orchestration**: Create a `user.deleted` handler that triggers destruction of the associated key in the KMS.

### Current status

✅ Identity and multi-tenancy enforced via `tenant_id` and `aggregate_id`  
✅ Encryption at edge implemented via `UserProjectionService` using `encryptUserProfile()`  
✅ Documentation added to relevant files for future integration  
⏳ Structural `encryption_key_id` field commented in UserEventBus envelope  
⏳ Per-user key rotation and shredding not yet implemented  

### Files documented (for future integration)
- `src/shared/events/UserEventBus.ts` - Added encryption_key_id comment in envelope interface
- `src/services/userProjectionService.ts` - Added encryption_key_id storage comment
- `src/shared/lib/security/cryptoShreddingBrowser.ts` - Added KMS implementation comment

### Files to be created (future)
- `src/services/KeyManagementService.ts` - Implement KMS for per-user key management

---

## 0014 — Session Completion: Documentation & Lint Resolution

**Date:** 2026-07-14
**Status:** completed

### Goal
Complete the recommended session sequence: GDPR documentation, runtime validation preparation, and lint resolution.

### Implementation

**GDPR Documentation**:
- Created `docs/GDPR_READINESS.md` comprehensive documentation
- Documented crypto-shredding architectural strategy
- Outlined implementation roadmap for KMS integration
- Included security considerations and operational procedures
- Provided external stakeholder communication document

**Lint Resolution**:
- Fixed 5 React hooks dependency warnings
- `useDealerVoice.ts`: Added useCallback for enqueueSpeech and speakNow, memoized phaseAnnouncements with useMemo, fixed dependency arrays
- `JumpToMenu.tsx`: Memoized menuItems with useMemo to prevent re-render on every prop change
- `I18nProvider.tsx`: Used useRef for initialization tracking to prevent re-initialization loop while satisfying lint rules

### Files created
`docs/GDPR_READINESS.md`

### Files modified
`src/shared/lib/speech/useDealerVoice.ts`, `src/pages/landing/ui/JumpToMenu.tsx`, `src/shared/lib/i18n/I18nProvider.tsx`

### Validation
✅ Typecheck passing
✅ Lint passing (0 warnings, 0 errors)
✅ GDPR documentation comprehensive and external-facing
