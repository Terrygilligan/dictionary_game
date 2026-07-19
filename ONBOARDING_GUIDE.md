# Lexicon Master - New Colleague Onboarding Guide
**Last Updated**: 2026-07-19  
**Project Version**: 0.1.0  
**Target Audience**: New team members joining the Lexicon Master project

---

## Welcome to Lexicon Master! 🎉

This guide will help you get up to speed with the Lexicon Master project. Lexicon Master is a sophisticated vocabulary-building game built with modern web technologies and event-sourcing architecture.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Quick Start](#quick-start)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Code Structure](#code-structure)
6. [Key Concepts](#key-concepts)
7. [Development Workflow](#development-workflow)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting & Gotchas](#troubleshooting--gotchas)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Important Resources](#important-resources)
13. [Recent Changes](#recent-changes)
14. [Tips & Best Practices](#tips--best-practices)

---

## Project Overview

### What is Lexicon Master?

Lexicon Master is a multiple-choice dictionary game where players:
- See a word and pick its correct definition from four options
- Build vocabulary through gameplay
- Track progress and statistics
- Engage with a community feature (Village)

### Core Features
- **Vocabulary Game**: Main gameplay with word definition matching
- **User System**: Authentication, profiles, and progress tracking
- **Village Feature**: Community building and social aspects
- **Multi-language Support**: Internationalization (i18n) for multiple languages
- **Admin Dashboard**: Superadmin tools for content management
- **Audit System**: Comprehensive event logging and analytics

### Project Philosophy
- **Event Sourcing**: All state changes are immutable events
- **Feature-Sliced Design**: Strict architectural layering
- **Type Safety**: Full TypeScript strictness
- **Security First**: GDPR compliance and proper data encryption
- **Backend-First**: Sensitive operations handled by Cloud Functions

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5
- **State Management**: Custom event-sourced stores (no Redux/Zustand)
- **Styling**: CSS with component-scoped styles
- **Testing**: Vitest 3.2.4, React Testing Library

### Backend
- **BaaS**: Firebase (Auth, Firestore, Storage, Functions)
- **Cloud Functions**: Node.js 20 (Firebase Functions v2)
- **Email Service**: Resend API
- **Secret Management**: Google Secret Manager

### Development Tools
- **Package Manager**: npm
- **Linting**: oxlint
- **Type Checking**: TypeScript compiler
- **Version Control**: Git

---

## Quick Start

### Prerequisites
- Node.js 20+ (functions require Node.js 20)
- npm or yarn
- Git
- Firebase CLI (`npm install -g firebase-tools`)
- A modern code editor (VS Code recommended)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dictionary_game
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173 in your browser

### Firebase Setup

1. **Authenticate with Firebase**
   ```bash
   firebase login
   ```

2. **Set up Firebase project**
   - Go to Firebase Console
   - Create or select project `lexicon-master-adb6b`
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Enable Cloud Functions

3. **Configure environment variables**
   ```bash
   # Required in .env
   VITE_FIREBASE_PROJECT_ID=lexicon-master-adb6b
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=lexicon-master-adb6b.firebaseapp.com
   VITE_FIREBASE_APP_ID=your_app_id
   ```

---

## Architecture Deep Dive

### Feature-Sliced Design (FSD)

The project follows strict FSD architecture with one-directional dependencies:

```
app → pages → features → entities → shared
```

**Layers Explained:**

- **app** - Composition root, providers, global styles
- **pages** - Route-level components, compose features
- **features** - Business features (play-round, auth, etc.)
- **entities** - Domain entities (game, user, vocabulary, village)
- **shared** - Framework-agnostic utilities, UI kit, libraries

**Golden Rule**: A layer may only import from layers below it. Never import sideways!

### Event Sourcing Architecture

**Core Concept**: State is derived solely from an immutable event log.

```
UI → Command → Decider → Events → Event Log
                                ↓
State ← Evolver ← Fold ← Events
```

**Key Components:**

1. **Commands**: User intentions (startGame, submitAnswer, nextRound)
2. **Decider**: Pure function `(state, command) → events`
3. **Evolver**: Pure function `(state, event) → state`
4. **Event Log**: Append-only sequence of events
5. **State**: Derived by folding events through evolver

**Benefits:**
- Complete audit trail
- Time travel debugging
- Deterministic replay
- No direct state mutation

### Email Architecture (Backend-First)

**Recent Migration (July 2026):**

```
Frontend → email_queue (write-only) → processEmailQueue Cloud Function → Resend API → Email
```

**Security Model:**
- Clients can only create email_queue documents
- Cloud Functions read and process queue
- Failed emails tracked in email_errors collection
- Templates managed centrally

---

## Code Structure

### Directory Overview

```
src/
├── app/              # Composition root
│   ├── providers/    # React providers (Auth, User, Game, etc.)
│   ├── styles/       # Global styles
│   └── ui/           # Root components
├── pages/            # Route pages
│   ├── auth/         # Authentication pages
│   ├── game/         # Game page
│   ├── village/      # Village page
│   └── profile/      # User profile
├── features/         # Business features
│   ├── play-round/   # Game gameplay feature
│   ├── audit-dashboard/ # Admin audit dashboard
│   └── super-admin-dashboard/ # Superadmin tools
├── entities/         # Domain entities
│   ├── game/         # Game domain logic
│   ├── user/         # User domain logic
│   ├── vocabulary/   # Vocabulary management
│   └── village/      # Village community logic
├── services/         # Application services
│   ├── auth.ts       # Authentication service
│   └── userService.ts # User operations
├── shared/           # Shared utilities
│   ├── api/          # Firebase configuration
│   ├── events/       # Event bus infrastructure
│   ├── lib/          # Utilities (logger, i18n, etc.)
│   └── ui/           # Shared UI components
└── tests/            # Test files
```

### Key Files to Know

- **src/main.tsx** - Application entry point
- **src/shared/api/firebase.ts** - Firebase initialization
- **src/services/auth.ts** - Authentication logic
- **src/entities/game/model/decide.ts** - Game decision logic
- **src/entities/game/model/evolve.ts** - Game state evolution
- **functions/src/index.ts** - Cloud Functions
- **functions/src/templates/emailTemplates.ts** - Email templates

---

## Key Concepts

### 1. Event Sourcing Terms

- **Event**: Immutable fact about something that happened
- **Command**: Intent to change state
- **Decider**: Pure function that validates commands and produces events
- **Evolver**: Pure function that applies events to state
- **Event Log**: Append-only storage of all events
- **Projection**: Read model derived from events

### 2. Firebase Integration

- **Authentication**: Firebase Auth for user management
- **Database**: Firestore for data persistence
- **Functions**: Cloud Functions for backend logic
- **Storage**: Firebase Storage for file uploads
- **Secrets**: Google Secret Manager for sensitive data

### 3. Security & GDPR

- **Encryption**: AES-256-GCM for user data
- **Write-Only Collections**: email_queue for secure email processing
- **Firestore Rules**: Multi-tenant access control
- **Service Account**: Backend operations use service account

### 4. Development Patterns

- **Pure Functions**: No side effects in business logic
- **Dependency Injection**: Services injected via providers
- **Error Boundaries**: React error boundaries for UI resilience
- **Lazy Loading**: Services initialized on first access

---

## Development Workflow

### Daily Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Type check while developing**
   ```bash
   npm run typecheck
   ```

3. **Lint code**
   ```bash
   npm run lint
   ```

4. **Run tests**
   ```bash
   npm test
   ```

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: Feature branches
- **bugfix/**: Bug fix branches

### Commit Convention

Follow conventional commits:
```
feat: add new vocabulary game feature
fix: resolve authentication token refresh issue
docs: update onboarding guide
refactor: simplify event store implementation
```

### Code Review Process

1. Create feature branch from develop
2. Make changes with proper commits
3. Run tests and type checking
4. Create pull request to develop
5. Request review from team
6. Address feedback
7. Merge when approved

---

## Common Tasks

### Adding a New Game Feature

1. Create feature in `src/features/your-feature/`
2. Follow FSD structure (model, ui, index.ts)
3. Add decider/evolver if using event sourcing
4. Create page in `src/pages/your-page/`
5. Add route in navigation
6. Update types and interfaces

### Modifying User Authentication

1. Edit `src/services/auth.ts`
2. Update `src/entities/user/` domain logic
3. Test authentication flow
4. Update Firestore rules if needed
5. Test with Firebase emulators

### Adding Email Templates

1. Edit `functions/src/templates/emailTemplates.ts`
2. Add new template function
3. Update template types
4. Test with Cloud Functions emulator
5. Deploy functions: `firebase deploy --only functions`

### Updating Firestore Rules

1. Edit `firestore.rules`
2. Test with Firebase emulator
3. Deploy: `firebase deploy --only firestore:rules`
4. Test in development environment
5. Deploy to production

### Debugging Event Sourcing

1. Check event log in Firestore
2. Use console logs in decider/evolver
3. Verify event structure matches types
4. Test event replay logic
5. Check projection calculations

---

## Troubleshooting & Gotchas

This section covers common pitfalls and issues the team has encountered during development. Understanding these gotchas will save you hours of debugging time.

### Firestore Security Rule Compliance

#### 🚨 Gotcha: Client-Side Code Must Match Security Rules

**Problem**: Your client code tries to read/write Firestore data but gets permission errors even though you think the rules should allow it.

**Root Cause**: Firestore rules are enforced at the database level, not just in your code. Your client operations must exactly match what the rules allow.

**Example Issue**:
```typescript
// ❌ WRONG - This will fail even if you think it should work
const docRef = doc(db, 'email_queue', docId)
const docSnap = await getDoc(docRef) // FAILS - rules deny read
```

**Solution**:
```typescript
// ✅ CORRECT - Only create, never read
const emailQueueRef = collection(db, 'email_queue')
await addDoc(emailQueueRef, {
  email, userId, template, data, status: 'pending', createdAt: serverTimestamp()
})
// Don't try to read it back - rules deny read access
```

**Key Rules for email_queue**:
- ✅ ALLOW: `create` for authenticated users with matching `userId`
- ❌ DENY: `read`, `update`, `delete` (only Cloud Functions can do these)

#### 🚨 Gotcha: Multi-Tenant Collection Access

**Problem**: You're trying to access user data but getting permission denied errors.

**Root Cause**: The project uses multi-tenant architecture where data access is scoped by `tenant_id`.

**Solution**: Always include `tenant_id` in your queries:
```typescript
// ❌ WRONG - Missing tenant scoping
const usersRef = collection(db, 'users')
const q = query(usersRef, where('email', '==', userEmail))

// ✅ CORRECT - Include tenant scoping
const { tenant_id } = useGameIdentity()
const usersRef = collection(db, 'users')
const q = query(usersRef, 
  where('tenant_id', '==', tenant_id),
  where('email', '==', userEmail)
)
```

### Event Sourcing Pitfalls

#### 🚨 Gotcha: Impure Decider Functions Break Determinism

**Problem**: Your event replay gives different results each time, or tests fail intermittently.

**Root Cause**: Decider functions must be pure - no I/O, no randomness, no `Date.now()`.

**Example Issue**:
```typescript
// ❌ WRONG - Impure decider
function decide(state: State, command: Command): Event[] {
  if (command.type === 'START_GAME') {
    return [{
      type: 'game/started',
      timestamp: Date.now(), // ❌ Non-deterministic
      randomSeed: Math.random() // ❌ Different each time
    }]
  }
}
```

**Solution**:
```typescript
// ✅ CORRECT - Pure decider with externalized randomness
function decide(state: State, command: Command): Event[] {
  if (command.type === 'START_GAME') {
    // Randomness happens BEFORE dispatch, captured in command
    const { shuffledDeck, randomSeed } = command.data
    return [{
      type: 'game/started',
      deck: shuffledDeck, // ✅ Deterministic - provided in command
      randomSeed, // ✅ Deterministic - provided in command
      timestamp: command.timestamp // ✅ Provided by caller
    }]
  }
}
```

#### 🚨 Gotcha: Missing Event Data Breaks Evolvers

**Problem**: Your evolver crashes with "undefined" errors when replaying events.

**Root Cause**: Events must contain all data needed for state evolution. Never reference external state in evolvers.

**Solution**:
```typescript
// ❌ WRONG - Evolver depends on external state
function evolve(state: State, event: Event): State {
  if (event.type === 'word/correct') {
    const word = getWordFromSomewhere(event.wordId) // ❌ Impure
    return { ...state, score: state.score + word.points }
  }
}

// ✅ CORRECT - All data in event
function evolve(state: State, event: Event): State {
  if (event.type === 'word/correct') {
    return { 
      ...state, 
      score: state.score + event.points // ✅ Data in event
    }
  }
}
```

### Firebase Cloud Functions Issues

#### 🚨 Gotcha: Node.js Version Mismatch

**Problem**: Cloud Functions deployment fails with engine warnings or runtime errors.

**Root Cause**: Local Node version doesn't match Functions runtime requirement.

**Example Error**:
```
npm warn EBADENGINE Unsupported engine
required: { node: '20' }
current: { node: 'v23.11.0' }
```

**Solution**:
- Use Node Version Manager (nvm) to switch to Node 20: `nvm use 20`
- Or update functions/package.json to match your local version (not recommended for production)
- Always check runtime deprecation warnings - Node.js 20 deprecated 2026-04-30

#### 🚨 Gotcha: Secret Manager Access Denied

**Problem**: Cloud Function fails with "Permission denied while accessing secret"

**Root Cause**: Cloud Function service account doesn't have Secret Manager access.

**Solution**:
```bash
# Grant access manually (automated during deploy, but sometimes fails)
gcloud secrets add-iam-policy-binding RESEND_API_KEY \
  --member="serviceAccount:737778580965-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Prevention**: First deployment may take a few minutes for permissions to propagate. Retry if you get permission errors on initial deploy.

### React & State Management

#### 🚨 Gotcha: Ghost Renders in Page Components

**Problem**: Page components render multiple times or when they shouldn't, causing console errors.

**Root Cause**: React Router renders components for route matching even if not active.

**Solution**: Add ghost render detection in page components:
```typescript
export function GamePage() {
  const { currentPage } = useNavigation()
  
  // Ghost render detection
  if (currentPage !== 'game') {
    console.error('🎮 GHOST RENDER DETECTED - currentPage:', currentPage)
    return null // Prevent rendering
  }
  
  // Normal component logic
}
```

#### 🚨 Gotcha: Provider Initialization Race Conditions

**Problem**: Components try to use context before providers are initialized.

**Root Cause**: Providers have async initialization but components render synchronously.

**Solution**: Always check for null/undefined in provider hooks:
```typescript
export function useGameState() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGameState must be used within GameProvider')
  }
  if (!context.state) {
    return { state: null, isLoading: true } // Handle loading state
  }
  return context
}
```

### Development Environment Issues

#### 🚨 Gotcha: Firebase Admin in Client Dependencies

**Problem**: Bundle size is huge, or you get "process is not defined" errors in browser.

**Root Cause**: `firebase-admin` is included in client package.json but it's backend-only.

**Solution**: 
- Remove `firebase-admin` from root package.json
- Keep it only in `functions/package.json`
- If you need admin functionality in client, use Cloud Functions instead

#### 🚨 Gotcha: Environment Variables Not Loading

**Problem**: `import.meta.env.VITE_*` variables are undefined in production.

**Root Cause**: Vite only exposes variables starting with `VITE_`, and .env files must be in project root.

**Solution**:
- Ensure all env vars start with `VITE_` prefix
- Check .env file is in project root (not in src/)
- Restart dev server after adding new variables
- In production, vars must be set in deployment environment

#### 🚨 Gotcha: Path Alias Resolution in Tests

**Problem**: Tests fail with "Cannot find module '@/services'" when run directly.

**Root Cause**: Path aliases (`@/*`) work in Vite but not in direct Node execution.

**Solution**:
- Use test runner that supports Vite config (Vitest does this automatically)
- Or use relative imports in test files
- Or configure tsconfig paths for Node execution

### Email Queue Specific Issues

#### 🚨 Gotcha: Email Queue Documents Not Processing

**Problem**: Documents appear in email_queue but Cloud Function never triggers.

**Root Cause**: Cloud Function may not be deployed, or trigger path doesn't match collection name.

**Solution**:
```typescript
// Check your function trigger matches collection name exactly
export const processEmailQueue = onDocumentCreated(
  {
    document: 'email_queue/{docId}', // ✅ Must match collection name exactly
    secrets: [resendApiKey],
  },
  async (event) => { /* ... */ }
)
```

**Debugging**:
- Check Cloud Function logs in Firebase Console
- Verify function is deployed: `firebase functions:list`
- Check trigger path matches collection name exactly

#### 🚨 Gotcha: Template Data Structure Validation

**Problem**: Email queue writes fail with "Invalid data structure" errors.

**Root Cause**: Firestore rules validate the `data` field must be a map, not a string or other type.

**Solution**:
```typescript
// ❌ WRONG - data is not a map
await addDoc(emailQueueRef, {
  email, userId, template,
  data: 'username', // ❌ String, not a map
})

// ✅ CORRECT - data is a map
await addDoc(emailQueueRef, {
  email, userId, template,
  data: { username: 'testUser' }, // ✅ Map/object
})
```

### TypeScript Configuration Gotchas

#### 🚨 Gotcha: Strict Null Checks Cause Unexpected Errors

**Problem**: Code that "should work" fails TypeScript strict null checks.

**Root Cause**: TypeScript strict mode requires explicit null handling.

**Solution**:
```typescript
// ❌ WRONG - Potentially undefined
const userName = user.name.toUpperCase()

// ✅ CORRECT - Explicit null check
const userName = user.name?.toUpperCase() || 'Anonymous'

// ✅ CORRECT - Type guard
if (user.name) {
  const userName = user.name.toUpperCase()
}
```

#### 🚨 Gotcha: Import Type Errors with Path Aliases

**Problem**: Imports using `@/*` work in development but fail in production build.

**Root Cause**: TypeScript path aliases not resolved by bundler.

**Solution**: Ensure Vite config matches tsconfig paths:
```javascript
// vite.config.ts
export default {
  resolve: {
    alias: {
      '@': '/src' // Must match tsconfig.json paths
    }
  }
}
```

### Common Deployment Issues

#### 🚨 Gotcha: Orphaned Cloud Functions Block Deployment

**Problem**: Deployment fails with "functions found in project but do not exist in local source code"

**Root Cause**: Old functions still deployed but removed from local code.

**Solution**:
```bash
# List deployed functions
firebase functions:list

# Delete orphaned functions
firebase functions:delete oldFunctionName --region regionName
```

#### 🚨 Gotcha: Firestore Rules Deployment Fails Silently

**Problem**: `firebase deploy --only firestore:rules` appears to succeed but rules don't update.

**Root Cause**: Rules have syntax errors that Firebase catches but doesn't clearly report.

**Solution**:
- Test rules locally: `firebase emulators:start --only firestore`
- Use Firebase Console Rules Playground to test rules interactively
- Check rule syntax carefully - even small typos cause failures

### Performance Gotchas

#### 🚨 Gotcha: Excessive Console Logging in Production

**Problem**: Application performance degrades in production with many console.log statements.

**Root Cause**: 459+ console.log statements across the codebase (as of audit).

**Solution**:
- Use conditional logging: `if (import.meta.env.DEV) console.log(...)`
- Use proper logging library with levels (debug, info, warn, error)
- Remove debug logs before production deployment
- Consider using a logging service for production

#### 🚨 Gotcha: Firebase Bundle Size Bloat

**Problem**: Initial bundle size is very large (>500KB) causing slow load times.

**Root Cause**: Importing entire Firebase SDK instead of specific modules.

**Solution**:
```typescript
// ❌ WRONG - Imports entire Firebase
import firebase from 'firebase/app'

// ✅ CORRECT - Imports only what you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
```

### Quick Reference Checklist

Before deploying or committing, check:

- [ ] No console.log statements in production code
- [ ] All security rules tested with emulator
- [ ] Decider/evolver functions are pure
- [ ] Environment variables use VITE_ prefix
- [ ] Path aliases work in both dev and build
- [ ] Firebase Admin not in client dependencies
- [ ] Cloud Functions runtime version is current
- [ ] Email queue data structure is correct (maps, not strings)
- [ ] Multi-tenant queries include tenant_id
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`

---

## Testing

### Current Test Setup

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Test Environment**: jsdom

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test path/to/test.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Test Coverage Areas to Improve

1. **Unit Tests**: Decider/evolver functions
2. **Integration Tests**: Authentication flow
3. **Component Tests**: UI components
4. **E2E Tests**: Critical user journeys

---

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages (if configured)
npm run deploy
```

### Cloud Functions Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:processEmailQueue

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Environment Setup

**Development**: Uses `.env` file  
**Production**: Uses `.env.production.local` (not in git)

### Deployment Checklist

- [ ] All tests passing
- [ ] Type checking successful
- [ ] Linting clean
- [ ] Environment variables configured
- [ ] Firebase rules tested
- [ ] Cloud Functions tested locally
- [ ] Backup current deployment
- [ ] Deploy to staging first
- [ ] Monitor deployment logs
- [ ] Test in production environment

---

## Important Resources

### Documentation Files

- **README.md** - Project overview and quick start
- **AGENTS.md** - Contributor guidelines and rules
- **ARCHITECTURAL_MANIFESTO.md** - Architecture principles
- **BACKEND_MIGRATION_ROADMAP.md** - Backend migration status
- **SCRATCHPAD.md** - Development notes and rationale
- **ONBOARDING_GUIDE.md** - This file

### Configuration Files

- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration
- **firebase.json** - Firebase deployment configuration
- **firestore.rules** - Firestore security rules

### External Resources

- **Firebase Console**: https://console.firebase.google.com/project/lexicon-master-adb6b/overview
- **Firebase Documentation**: https://firebase.google.com/docs
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **TypeScript Documentation**: https://www.typescriptlang.org/docs/

---

## Recent Changes (July 2026)

### Email Migration Completed ✅

**What Changed:**
- Migrated email sending from client-side to Cloud Functions
- Implemented `email_queue` collection with write-only security
- Created `processEmailQueue` Cloud Function
- Added template mapper system for email content
- Integrated Resend API for email delivery
- Removed legacy email processing code

**Why It Matters:**
- Improved security (no API keys in client)
- Better reliability (retry logic, error tracking)
- Scalability (queue-based processing)
- Easier maintenance (centralized templates)

**Files Modified:**
- `src/services/auth.ts` - Updated to use email_queue
- `functions/src/index.ts` - New Cloud Function
- `functions/src/templates/emailTemplates.ts` - Template system
- `firestore.rules` - Email queue security rules
- `firebase.json` - Functions configuration

**How to Use:**
```typescript
// In AuthService, emails are now queued automatically
await authService.signUp(email, password, displayName)
// This queues a welcome email in email_queue
// Cloud Function processes it and sends via Resend
```

---

## Tips & Best Practices

### DO ✅

- **Follow FSD strictly** - Never import sideways between layers
- **Keep functions pure** - No side effects in decider/evolver
- **Use TypeScript strictly** - Enable all strict flags
- **Write meaningful commits** - Follow conventional commits
- **Test your changes** - Run typecheck and lint before committing
- **Document complex logic** - Add comments for non-obvious code
- **Use environment variables** - Never hardcode sensitive data
- **Follow event sourcing** - Always use events for state changes

### DON'T ❌

- **Don't import from sibling entities** - Violates FSD principles
- **Don't mutate state directly** - Use events instead
- **Don't skip type checking** - TypeScript catches many errors
- **Don't commit sensitive data** - Use .gitignore properly
- **Don't ignore security** - Follow GDPR and security best practices
- **Don't make functions impure** - Keep business logic pure
- **Don't skip testing** - Tests prevent regressions
- **Don't deploy without testing** - Always test in staging first

### Debugging Tips

1. **Use Firebase Emulator** for local development
2. **Check Firestore Console** for data issues
3. **Use console.log sparingly** - Remove before production
4. **Check Cloud Functions logs** for backend issues
5. **Use React DevTools** for component debugging
6. **Check network tab** for API issues
7. **Use TypeScript strict mode** - catches many bugs

### Performance Tips

1. **Lazy load routes** - Implement code splitting
2. **Optimize Firebase imports** - Use tree-shaking
3. **Use React.memo** for expensive components
4. **Debounce expensive operations**
5. **Monitor bundle size** - Keep it reasonable
6. **Use Firebase caching** - Leverage Firestore caching

---

## Getting Help

### Team Communication

- **Daily Standups**: Share progress and blockers
- **Code Reviews**: Get feedback on changes
- **Documentation**: Update docs when making changes
- **Questions**: Ask in team channels

### Common Issues

**Issue**: Firebase authentication not working
**Solution**: Check environment variables and Firebase console configuration

**Issue**: Type errors in event sourcing
**Solution**: Verify event types match interfaces

**Issue**: Cloud Functions not deploying
**Solution**: Check Node version and Firebase CLI version

**Issue**: Firestore rules rejecting writes
**Solution**: Check rules in Firebase console and test with emulator

### Learning Resources

1. **Event Sourcing**: Read event sourcing documentation
2. **Firebase**: Complete Firebase codelabs
3. **React**: React documentation and tutorials
4. **TypeScript**: TypeScript handbook
5. **FSD**: Feature-Sliced Design documentation

---

## Your First Week Checklist

### Day 1-2: Setup & Overview
- [ ] Complete development environment setup
- [ ] Run the application locally
- [ ] Read key documentation files
- [ ] Understand project structure
- [ ] Set up Firebase CLI

### Day 3-4: Code Deep Dive
- [ ] Study event sourcing implementation
- [ ] Review authentication flow
- [ ] Understand FSD architecture
- [ ] Read through key services
- [ ] Examine Cloud Functions

### Day 5: First Contribution
- [ ] Pick a small task or bug fix
- [ ] Create feature branch
- [ ] Implement changes
- [ ] Write tests
- [ ] Submit pull request

---

## Welcome Aboard! 🚀

We're excited to have you join the Lexicon Master team. This project uses cutting-edge architecture and modern development practices. Don't hesitate to ask questions - we're here to help you succeed.

**Key Contact Points:**
- Technical questions: Team technical lead
- Architecture questions: Senior developers
- Deployment issues: DevOps team
- General help: Any team member

Good luck with your onboarding! 🎯
