# Navigation State Diagnostic Report

**Date**: July 14, 2026  
**Issue**: 'Village' tab stuck in active state regardless of navigation  
**Status**: Root Cause Identified  

---

## Component Discovery

**Component File**: `src/shared/ui/Header.tsx` (lines 1-102)  
**Navigation Context**: `src/shared/lib/navigation/NavigationContext.tsx` (lines 1-118)  
**CSS File**: `src/app/styles/index.css` (lines 1597-1646)

The navigation bar is implemented in the `Header` component which consumes the navigation context to determine the active page state.

---

## State Logic Analysis

### Current Active State Logic

**Header Component** (`src/shared/ui/Header.tsx`):
```typescript
// Line 14: Gets current page from navigation context
const { navigate, currentPage } = useNavigation()

// Line 63: Sets data attribute on header element
<header className="header" data-active-page={currentPage}>

// Lines 73-78: Determines active class for each navigation item
{getNavigationItems().map((item) => {
  const activeClass = currentPage === item.key ? 'header__nav-link--active' : ''
  const className = `${baseClasses} ${primaryClass} ${adminClass} ${activeClass}`.trim()
  
  return (
    <Button
      key={item.key}
      variant="ghost"
      onClick={() => navigate(item.key)}
      className={className}
      data-nav-page={item.key}
    >
```

**Navigation Context** (`src/shared/lib/navigation/NavigationContext.tsx`):
```typescript
// Lines 3: Page type definition
export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'game' | 'village' | 'admin'

// Lines 18-31: URL to page mapping
const [currentPage, setCurrentPage] = useState<Page>(() => {
  const path = window.location.pathname
  
  if (path === '/' || path === '/landing') return 'landing'
  if (path === '/auth') return 'auth'
  if (path === '/games') return 'games'  // <-- Note: 'games' with 's'
  if (path === '/profile') return 'profile'
  if (path === '/game') return 'game'    // <-- Note: 'game' without 's'
  if (path === '/village') return 'village'
  if (path === '/admin') return 'admin'
  
  return 'landing'
})
```

### CSS Active State Logic

**CSS File** (`src/app/styles/index.css`):
```css
/* Lines 1625-1637: CSS-Attribute Truth: Active state based on parent data attribute */
.header[data-active-page="landing"] .header__nav-link[data-nav-page="landing"],
.header[data-active-page="games"] .header__nav-link[data-nav-page="games"],    /* <-- Expects 'games' */
.header[data-active-page="village"] .header__nav-link[data-nav-page="village"],
.header[data-active-page="profile"] .header__nav-link[data-nav-page="profile"],
.header[data-active-page="admin"] .header__nav-link[data-nav-page="admin"] {
  background: var(--accent) !important;
  color: white;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.3);
  font-weight: 600;
}
```

---

## Path Matching Audit

### Navigation Item Configuration

**Header Component** (`src/shared/ui/Header.tsx`):
```typescript
// Lines 49-59: Navigation items configuration
const getNavigationItems = () => {
  const allItems = [
    { key: 'landing' as Page, translationKey: 'ui.home', show: true, authRequired: false },
    { key: 'game' as Page, translationKey: 'ui.gamesRoom', show: true, authRequired: false },  // <-- 'game' without 's'
    { key: 'village' as Page, translationKey: 'ui.village', show: isAuthenticated, authRequired: true },
    { key: 'profile' as Page, translationKey: 'ui.profile', show: isAuthenticated, authRequired: true },
    { key: 'auth' as Page, translationKey: 'ui.signIn', show: !isAuthenticated, authRequired: false },
    { key: 'admin' as Page, translationKey: 'ui.admin', show: isAuthenticated && isAdmin, authRequired: true, isAdminOnly: true },
  ]
```

### Critical Mismatch Identified

**Issue**: Page Type Inconsistency Between Navigation Context and Header Component

1. **Navigation Context** defines two separate page types:
   - `'games'` (with 's') - maps to URL `/games`
   - `'game'` (without 's') - maps to URL `/game`

2. **Header Component** uses `'game'` (without 's') for the Games Room navigation item

3. **CSS Selectors** expect `'games'` (with 's') for the active state:
   - `.header[data-active-page="games"] .header__nav-link[data-nav-page="games"]`

**Result**: When the URL is `/games`, the NavigationContext sets `currentPage = 'games'`, but the Header navigation item has `data-nav-page="game"`, causing a CSS selector mismatch.

---

## Logic Fault

**Primary Logic Fault**: CSS Selector Mismatch Due to Page Type Inconsistency

The 'Village' tab appears stuck because of a cascading failure in the CSS-based active state system:

1. **CSS-Attribute System**: The navigation uses a CSS-attribute based system where the parent header's `data-active-page` attribute must match the child button's `data-nav-page` attribute

2. **Selector Mismatch**: The CSS selector `.header[data-active-page="games"] .header__nav-link[data-nav-page="games"]` expects both attributes to be `"games"`, but the Header component sets `data-nav-page="game"`

3. **Fallback Behavior**: When CSS selectors don't match, the default styling applies, which may include the village tab's `header__nav-link--primary` class (line 75 in Header.tsx) that gives it a persistent active appearance

4. **Class Conflict**: The village tab has special styling as a "primary" navigation item:
   ```typescript
   const primaryClass = item.key === 'village' ? 'header__nav-link--primary' : ''
   ```

**Why Village Appears Stuck**: The `header__nav-link--primary` class applies a persistent background color (`var(--accent-strong)`) that makes the village tab appear active regardless of the actual navigation state.

---

## Proposed Fix Strategy

### High-Level Fix Approach

**1. Standardize Page Type Consistency**
- Remove the ambiguous dual page types (`'game'` vs `'games'`)
- Standardize on a single page type for the games functionality
- Update NavigationContext, Header component, and CSS selectors to use consistent naming

**2. Update Navigation Context**
- Remove `'game'` from the Page type union
- Keep only `'games'` for consistency with the URL pattern
- Update all path mappings to use consistent page names

**3. Update Header Component**
- Change navigation item key from `'game'` to `'games'`
- Ensure `data-nav-page` attributes match the expected CSS selectors

**4. Update CSS Selectors**
- Ensure CSS selectors match the standardized page type names
- Remove any redundant selectors for deprecated page types

**5. Alternative: CSS-Only Fix**
- Add CSS selectors for both `'game'` and `'games'` variants
- Maintain backward compatibility while standardizing the JavaScript logic

### Specific Code Changes Required

**File: `src/shared/lib/navigation/NavigationContext.tsx`**
```typescript
// Change line 3 from:
export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'game' | 'village' | 'admin'

// To:
export type Page = 'landing' | 'auth' | 'games' | 'profile' | 'village' | 'admin'
```

**File: `src/shared/ui/Header.tsx`**
```typescript
// Change line 52 from:
{ key: 'game' as Page, translationKey: 'ui.gamesRoom', show: true, authRequired: false },

// To:
{ key: 'games' as Page, translationKey: 'ui.gamesRoom', show: true, authRequired: false },
```

**File: `src/app/styles/index.css`**
```typescript
// Add selector for 'game' variant as temporary fix:
.header[data-active-page="game"] .header__nav-link[data-nav-page="game"],
.header[data-active-page="games"] .header__nav-link[data-nav-page="games"],
```

---

## Impact Assessment

**Severity**: Medium - Navigation UX issue but not breaking core functionality  
**Risk**: Low - Changes are localized to navigation system  
**Testing Required**: Navigation state changes, URL updates, active state visual feedback  

---

## Additional Findings

**Secondary Issue**: The navigation system uses both class-based and attribute-based active state determination:
- Class-based: `const activeClass = currentPage === item.key ? 'header__nav-link--active' : ''`
- Attribute-based: CSS selectors based on `data-active-page` and `data-nav-page`

This dual system creates potential for conflicts and should be standardized to a single approach.

**Recommendation**: Standardize on the CSS-attribute approach as it provides better separation of concerns and is more maintainable.

---

## Conclusion

The root cause of the 'Village' tab appearing stuck is a page type inconsistency between `'game'` and `'games'` in the navigation system, causing CSS selector mismatches. The village tab's persistent active appearance is due to its `header__nav-link--primary` class that applies styling independent of the actual navigation state. The fix requires standardizing page type naming across the NavigationContext, Header component, and CSS selectors.
