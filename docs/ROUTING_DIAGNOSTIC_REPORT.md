# Routing Base-Path Diagnostic Report

**Date**: July 14, 2026  
**Issue**: Routing mismatch preventing access to `/admin` route  
**Status**: Root Cause Identified  

---

## Configuration Audit

### Vite Configuration Analysis

**File**: `vite.config.ts` (line 7)
```typescript
export default defineConfig({
  base: '/dictionary_game/',
  // ...
})
```

**Finding**: The Vite `base` property is **hardcoded** to `/dictionary_game/`. This means:
- All assets and routes are expected to be served under this base path
- The development server expects URLs like `http://localhost:5173/dictionary_game/admin/`
- Direct access to `http://localhost:5173/admin/` will result in 404

### Router Configuration Analysis

**File**: `src/app/providers/router.tsx`
```typescript
export function AppRouter() {
  const { currentPage, navigate } = useNavigation()
  // Custom switch-based routing, no React Router
  switch (currentPage) {
    case 'admin':
      return <SuperAdminDashboardPage />
    // ...
  }
}
```

**Finding**: The application uses **custom routing** (not React Router) with no basename configuration. The router relies entirely on the NavigationContext for path resolution.

### Navigation Context Analysis

**File**: `src/shared/lib/navigation/NavigationContext.tsx`

**Path Initialization** (lines 18-30):
```typescript
const [currentPage, setCurrentPage] = useState<Page>(() => {
  const path = window.location.pathname
  
  if (path === '/' || path === '/landing') return 'landing'
  if (path === '/auth') return 'auth'
  if (path === '/games' || path === '/game') return 'games'
  if (path === '/profile') return 'profile'
  if (path === '/village') return 'village'
  if (path === '/admin') return 'admin'  // ❌ No base path consideration
  
  return 'landing'
})
```

**URL Updates** (lines 61-62):
```typescript
const urlPath = page === 'landing' ? '' : page
window.history.pushState(null, '', `/${urlPath}`)  // ❌ No base path consideration
```

**Browser Back/Forward Handler** (lines 78-85):
```typescript
const handlePopState = () => {
  const path = window.location.pathname
  if (path === '/' || path === '/landing') setCurrentPage('landing')
  else if (path === '/auth') setCurrentPage('auth')
  else if (path === '/games' || path === '/game') setCurrentPage('games')
  else if (path === '/profile') setCurrentPage('profile')
  else if (path === '/village') setCurrentPage('village')
  else if (path === '/admin') setCurrentPage('admin')  // ❌ No base path consideration
}
```

**Finding**: NavigationContext uses `window.location.pathname` **directly** without accounting for the Vite base path configuration.

---

## Mismatch Identification

### The Core Problem

**Vite Configuration vs. Application Logic**:

| Component | Expected URL Structure | Actual Implementation |
|-----------|----------------------|----------------------|
| **Vite Dev Server** | `/dictionary_game/{route}` | ✅ Configured correctly |
| **NavigationContext** | `/{route}` | ❌ Ignores base path |
| **User Access** | `http://localhost:5173/admin/` | ❌ Results in 404 |
| **Required Access** | `http://localhost:5173/dictionary_game/admin/` | ✅ Would work |

### Specific Failure Scenario

1. User navigates to `http://localhost:5173/admin/`
2. Vite dev server returns 404 because base path is `/dictionary_game/`
3. Even if the URL was `http://localhost:5173/dictionary_game/admin/`:
   - NavigationContext would check `window.location.pathname` = `/dictionary_game/admin/`
   - Path matching logic expects `/admin/` (line 27)
   - No match found → defaults to landing page

### URL Path Matching Issues

**Current Implementation**:
```typescript
if (path === '/admin') return 'admin'  // Expects exact match
```

**With Base Path**:
```typescript
// When base = '/dictionary_game/'
// window.location.pathname = '/dictionary_game/admin'
// if (path === '/admin') return 'admin'  // ❌ No match!
```

---

## Impact Analysis

### Event-Sourced Identity Injection Impact

**Assessment**: ✅ **NO IMPACT** on event-sourced identity injection

**Reasoning**:
1. **Identity Resolution**: Tenant ID and aggregate ID resolution is independent of routing
2. **Store Initialization**: User and game stores initialize based on Firebase auth state, not URL paths
3. **Command Enforcement**: Multi-tenant command enforcement occurs at domain logic level, not routing level
4. **Audit Trail**: Event logging uses tenant_id/aggregate_id from authentication context, not routing parameters

**Verification Points**:
- `useGameIdentity` hook resolves identity from Firebase auth, not URL
- `useUserStore` initializes from auth state, not routing parameters
- Village domain identity resolution uses game identity, not URL paths
- All command enforcement happens in `decide.ts` functions, not routing logic

### Authenticated Event-Sourcing Flow

**Current Flow** (Unaffected):
1. User authenticates via Firebase
2. Auth state triggers identity resolution in UserProvider
3. Stores initialize with tenant_id/aggregate_id from auth claims
4. Commands enforce identity validation at domain level
5. Events logged with proper identity metadata

**With Base Path Fix** (No Change):
- Same flow, only URL structure changes
- Identity resolution remains auth-based, not URL-based
- Command enforcement unchanged
- Audit trail integrity maintained

---

## Recommended Solution

### Option 1: Conditional Base Path (RECOMMENDED)

**Rationale**: Provides flexibility for local development while maintaining production deployment consistency.

**Implementation**:

**vite.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/dictionary_game/',
  // ... rest of config
}))
```

**Benefits**:
- ✅ Local development: Routes work at `http://localhost:5173/admin/`
- ✅ Production: Routes work at `https://username.github.io/dictionary_game/admin/`
- ✅ No changes required to NavigationContext
- ✅ Zero impact on event-sourcing architecture
- ✅ Maintains deployment consistency for GitHub Pages

**Trade-offs**:
- ⚠️ Requires environment-specific configuration
- ⚠️ Development and production URLs differ

### Option 2: Dynamic Base Path Detection

**Rationale**: Makes NavigationContext aware of Vite base path configuration.

**Implementation**:

**NavigationContext.tsx**:
```typescript
const getBasePath = () => {
  const viteBase = import.meta.env.BASE_URL || '/'
  return viteBase.replace(/\/$/, '') // Remove trailing slash
}

const [currentPage, setCurrentPage] = useState<Page>(() => {
  const path = window.location.pathname
  const basePath = getBasePath()
  
  // Remove base path from pathname for matching
  const relativePath = path.startsWith(basePath) 
    ? path.slice(basePath.length) || '/'
    : path
  
  if (relativePath === '/' || relativePath === '/landing') return 'landing'
  if (relativePath === '/auth') return 'auth'
  if (relativePath === '/games' || relativePath === '/game') return 'games'
  if (relativePath === '/profile') return 'profile'
  if (relativePath === '/village') return 'village'
  if (relativePath === '/admin') return 'admin'
  
  return 'landing'
})

const navigate = (page: Page) => {
  // ...
  const basePath = getBasePath()
  const urlPath = page === 'landing' ? '' : page
  window.history.pushState(null, '', `${basePath}/${urlPath}`)
}
```

**Benefits**:
- ✅ NavigationContext becomes base-path aware
- ✅ Works with any base path configuration
- ✅ No Vite config changes needed
- ✅ Single source of truth for URL handling

**Trade-offs**:
- ⚠️ More complex path matching logic
- ⚠️ Requires changes to multiple functions in NavigationContext
- ⚠️ Potential edge cases in path handling

### Option 3: Environment Variable Configuration

**Rationale**: Provides explicit control via environment variables.

**Implementation**:

**.env**:
```bash
VITE_BASE_PATH=/dictionary_game/
```

**.env.local** (for local development):
```bash
VITE_BASE_PATH=/
```

**vite.config.ts**:
```typescript
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/dictionary_game/',
  // ...
})
```

**Benefits**:
- ✅ Explicit configuration control
- ✅ Easy to switch between environments
- ✅ No code changes needed for different deployments

**Trade-offs**:
- ⚠️ Requires environment file management
- ⚠️ Additional configuration overhead
- ⚠️ Developers must remember to set up .env.local

---

## Final Recommendation

### Primary Recommendation: Option 1 (Conditional Base Path)

**Justification**:
1. **Minimal Code Changes**: Only requires updating `vite.config.ts`
2. **Zero Routing Logic Changes**: NavigationContext remains unchanged
3. **Event-Sourcing Integrity**: No impact on identity resolution or command enforcement
4. **Deployment Consistency**: Maintains GitHub Pages deployment requirements
5. **Developer Experience**: Local development works with intuitive URLs

**Implementation Steps**:
1. Update `vite.config.ts` to use conditional base path based on mode
2. Test local development at `http://localhost:5173/admin/`
3. Test production build at expected GitHub Pages URL
4. Verify navigation context still works correctly
5. Confirm event-sourcing flow remains unaffected

### Fallback Recommendation: Option 2 (Dynamic Detection)

If Option 1 proves insufficient for specific deployment scenarios, implement Option 2 as it provides the most robust solution for handling arbitrary base paths without requiring configuration changes.

---

## Testing Checklist

### Pre-Implementation Testing
- [ ] Verify current 404 behavior at `http://localhost:5173/admin/`
- [ ] Confirm working behavior at `http://localhost:5173/dictionary_game/admin/`
- [ ] Document current navigation context behavior
- [ ] Verify event-sourcing identity resolution is working

### Post-Implementation Testing
- [ ] Test local development at `http://localhost:5173/admin/`
- [ ] Test all navigation routes work correctly
- [ ] Verify browser back/forward navigation
- [ ] Confirm URL updates correctly on navigation
- [ ] Test production build with base path
- [ ] Verify event-sourcing flow unchanged
- [ ] Confirm tenant_id/aggregate_id resolution still works
- [ ] Test audit trail generation

### Event-Sourcing Specific Tests
- [ ] User authentication still resolves identity correctly
- [ ] Game commands still enforce tenant_id/aggregate_id
- [ ] Village commands still enforce tenant_id/aggregate_id
- [ ] Audit logs still generate with proper metadata
- [ ] Multi-tenant isolation still enforced

---

## Risk Assessment

**Risk Level**: LOW  
**Reasoning**:
- Proposed changes are isolated to routing configuration
- No changes to domain logic or event-sourcing architecture
- Identity resolution and command enforcement remain unchanged
- Navigation context logic can be reverted if issues arise

**Mitigation Strategies**:
1. Implement Option 1 first (least invasive)
2. Comprehensive testing of navigation flows
3. Verify event-sourcing integrity post-implementation
4. Keep NavigationContext unchanged initially
5. Have rollback plan ready

---

## Conclusion

The routing mismatch is caused by a hardcoded Vite base path of `/dictionary_game/` that is not accounted for in the custom NavigationContext implementation. The recommended solution is to implement a conditional base path in `vite.config.ts` that uses `/` for local development and `/dictionary_game/` for production. This approach requires minimal code changes, maintains event-sourcing integrity, and provides the best developer experience while ensuring production deployment consistency.

**Impact on Event-Sourced Architecture**: ✅ NONE - Identity resolution, command enforcement, and audit trail generation are independent of routing configuration and will remain unaffected by the proposed changes.
