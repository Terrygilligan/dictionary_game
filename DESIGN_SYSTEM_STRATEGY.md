# Design System Strategy

**Authoritative documentation for Lexicon Master UI design tokens, patterns, and implementation guidelines.**

---

## Design Philosophy

Lexicon Master embraces a design philosophy centered on **accessibility, performance, and community-driven aesthetics**. Our visual identity is:

- **Clean and Minimal**: Uncluttered interfaces that prioritize content over decoration
- **Surreal Liquid Aesthetic**: Fluid, organic shapes and surreal elements that create visual interest without compromising usability
- **Accessibility-First**: WCAG 2.1 AA compliant with high contrast ratios and keyboard navigation
- **Google-Aligned but Unique**: Influenced by Material Design principles while maintaining distinct community-focused character
- **Performant-First**: Design decisions prioritize rendering speed and bundle size optimization
- **Multilingual-Native**: Typography and spacing accommodate diverse language scripts (Latin, Cyrillic, etc.)
- **Dark Mode Default**: Optimized for low-light environments with carefully crafted contrast ratios

---

## Core Token System

Our design token architecture follows a three-tier hierarchy: **Primitives → Semantics → Components**.

### Primitives
Base values that represent raw design decisions. These are the source of truth for all derived tokens.

**Location**: `src/shared/config/DesignSystem.ts` (or `src/app/styles/index.css` for current implementation)

#### Color Primitives
```typescript
colors: {
  // Backgrounds
  bg: '#0f1020',              // Primary background
  bgPanel: '#1a1c33',         // Panel/card backgrounds
  bgPanel2: '#22254080',      // Secondary panel with transparency
  
  // Accents
  accent: '#7c5cff',          // Primary accent (purple)
  accentStrong: '#9b83ff',    // Strong accent variant
  
  // Text
  text: '#eef0ff',            // Primary text
  textMuted: '#a7abd0',       // Secondary text
  
  // Status
  correct: '#2ec46b',         // Success/error correct
  incorrect: '#ff5d73',       // Error/incorrect state
}
```

#### Spacing Primitives
```typescript
spacing: {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  xxl: '3rem',      // 48px
}
```

#### Typography Primitives
```typescript
typography: {
  fontFamily: {
    base: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.875rem',   // 14px
  sm: '1rem',       // 16px
  md: '1.125rem',   // 18px
  lg: '1.25rem',    // 20px
  xl: '1.5rem',     // 24px
  xxl: '2rem',      // 32px
},
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

#### Border Radius Primitives
```typescript
borderRadius: {
  sm: '8px',
  md: '14px',     // Default panel radius
  lg: '20px',
  full: '9999px',
}
```

#### Motion Primitives
```typescript
motion: {
  // Easing curves for fluid animations
  fluid: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Smooth, liquid easing
  liquid: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // More pronounced liquid feel
  surreal: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy, surreal motion
  
  // Durations (optimized for performance)
  fast: '150ms',
  medium: '300ms',
  slow: '500ms',
  
  // Performance-friendly transforms
  scale: 'transform scale(1.05)',
  translate: 'transform translateY(-2px)',
  rotate: 'transform rotate(2deg)',
}
```

### Semantics
Functional names that assign meaning to primitives. These tokens communicate intent rather than visual values.

```typescript
semantics: {
  // Button Backgrounds
  buttonPrimaryBg: colors.accent,
  buttonPrimaryBgHover: colors.accentStrong,
  buttonGhostBg: 'transparent',
  buttonGhostBgHover: 'rgba(124, 92, 255, 0.1)',
  
  // Text Colors
  textPrimary: colors.text,
  textSecondary: colors.textMuted,
  textOnAccent: '#ffffff',
  
  // Panel Backgrounds
  panelBg: colors.bgPanel,
  panelBgHover: '#252845',
  
  // Interactive States
  focusRing: 'rgba(124, 92, 255, 0.5)',
  disabledOpacity: '0.5',
}
```

### Components
Specific constraints for core UI elements. These tokens combine semantic tokens into component-specific design specifications.

#### Button Component
```typescript
components: {
  button: {
    primary: {
      bg: semantics.buttonPrimaryBg,
      bgHover: semantics.buttonPrimaryBgHover,
      text: semantics.textOnAccent,
      padding: '1rem 2rem',
      borderRadius: borderRadius.md,
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.md,
      transition: 'all 0.2s ease',
    },
    ghost: {
      bg: semantics.buttonGhostBg,
      bgHover: semantics.buttonGhostBgHover,
      text: semantics.textPrimary,
      padding: '0.75rem 1.5rem',
      borderRadius: borderRadius.md,
      fontWeight: typography.fontWeight.medium,
      fontSize: typography.fontSize.sm,
    },
  }
}
```

#### Game Card Component
```typescript
components: {
  gameCard: {
    bg: semantics.panelBg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    button: {
      className: 'game-card__button',
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
    }
  }
}
```

#### Panel Component
```typescript
components: {
  panel: {
    bg: semantics.panelBg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    maxWidth: '800px',
    margin: '0 auto',
  }
}
```

---

## Visual Style Extension

The Surreal Liquid aesthetic introduces organic, fluid visual elements that enhance the user experience while maintaining strict accessibility and performance standards.

### Visual Motifs

#### Fluid Shapes
- **Organic Borders**: Use `border-radius` values that create soft, flowing edges (e.g., `border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%`)
- **Liquid Containers**: Implement blob-like containers for decorative elements using CSS `border-radius` manipulation
- **Flowing Gradients**: Use subtle, multi-stop gradients that suggest movement (e.g., `linear-gradient(135deg, var(--accent), var(--accent-strong))`)
- **Morphing Animations**: Apply slow, continuous shape morphing using CSS animations with performance-optimized transforms

**Constraint**: Surreal motifs must not interfere with accessibility or text readability. All text must remain on solid, high-contrast backgrounds regardless of surrounding fluid elements.

#### Surreal Elements
- **Floating Particles**: Subtle, slow-moving decorative elements that add depth without distraction
- **Liquid Transitions**: Smooth, organic state transitions using the motion tokens defined above
- **Abstract Forms**: Geometric shapes with softened edges that suggest surrealism
- **Organic Overlays**: Semi-transparent, textured layers that create visual interest

**Constraint**: Liquid/fluid animations must be optimized for performance using hardware-accelerated CSS transforms (`transform`, `opacity`, `filter`) rather than expensive properties like `box-shadow` or `border-radius` in animations.

### Implementation Guidelines

```css
/* Example: Fluid shape with performance-optimized animation */
.fluid-shape {
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: fluidMorph 8s ease-in-out infinite;
  will-change: transform; /* Performance hint */
}

@keyframes fluidMorph {
  0%, 100% {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    transform: scale(1);
  }
  50% {
    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
    transform: scale(1.05);
  }
}
```

---

## Dynamic Theming

Lexicon Master supports a two-layer theming architecture that separates functional UI from ornamental surreal elements.

### Base Theme
The foundational dark mode theme that ensures accessibility and usability:
- **Core semantics**: All text colors, button states, and interactive elements
- **Panel backgrounds**: Solid, high-contrast backgrounds for content areas
- **Typography**: Readable font sizes, weights, and line heights
- **Spacing**: Consistent layout spacing
- **Focus states**: Clear, accessible focus indicators

**Location**: `src/app/styles/index.css` (CSS custom properties)

### Ornamental Layer
The surreal, fluid visual layer that adds aesthetic interest:
- **Fluid shapes**: Organic, morphing decorative elements
- **Gradients**: Subtle color transitions for visual depth
- **Particles**: Floating, animated decorative elements
- **Textures**: Subtle surface treatments for visual richness
- **Surreal animations**: Organic motion using motion tokens

**Implementation**: Applied via CSS classes or component-level styling, never interfering with Base Theme semantics

### Layer Separation Rules

1. **Base Theme Priority**: All text, buttons, and interactive elements must use Base Theme tokens exclusively
2. **Ornamental Non-Interference**: Surreal elements must not overlap or obscure interactive elements
3. **Performance Isolation**: Ornamental layer animations should be `will-change` optimized and debatable
4. **Accessibility Independence**: Ornamental layer must be disableable without affecting functionality
5. **Semantic Continuity**: Even with surreal backgrounds, text must use semantic color tokens (e.g., `var(--text)`)

### Theme Composition Example

```css
/* Base Theme (always active) */
.panel {
  background: var(--bg-panel);
  color: var(--text);
  border-radius: var(--border-radius-md);
}

/* Ornamental Layer (optional, aesthetic only) */
.panel--surreal {
  position: relative;
  overflow: hidden;
}

.panel--surreal::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  opacity: 0.1;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: fluidMorph 8s ease-in-out infinite;
  pointer-events: none; /* Critical: non-interactive */
}

/* Content stays on Base Theme */
.panel--surreal > * {
  position: relative;
  z-index: 1; /* Above ornamental layer */
}
```

---

## Rules for AI/Design Interaction

Strict rules that must be followed by all AI agents and human designers working on Lexicon Master UI.

### Token Usage Rules
1. **Never hardcode values** - All colors, spacing, typography, and other design values must reference tokens from `src/shared/config/DesignSystem.ts` or `src/app/styles/index.css`
2. **No magic numbers** - All numeric values must be defined as spacing tokens or calculated from token values
3. **Token-first development** - New UI elements must have their design tokens defined in the Design System before implementation begins
4. **Semantic naming** - Use functional names (e.g., `buttonPrimaryBg`) rather than visual names (e.g., `purple500`)

### Accessibility Rules
1. **High contrast compliance** - All text must meet WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
2. **Focus indicators** - All interactive elements must have visible focus states using the `focusRing` semantic token
3. **Keyboard navigation** - All functionality must be accessible via keyboard alone
4. **Screen reader support** - Use semantic HTML and ARIA attributes where necessary
5. **Color independence** - Never rely on color alone to convey information

### Component Rules
1. **Consistent spacing** - Use spacing tokens consistently across components
2. **Responsive design** - Components must work across mobile, tablet, and desktop viewports
3. **Dark mode default** - Design primarily for dark mode with light mode considerations
4. **Performance awareness** - Avoid expensive CSS properties (box-shadow, filters) in animations

### Surreal Liquid Rules
1. **Semantic Continuity** - Even with surreal backgrounds, all text and interactive elements must use Base Theme semantic tokens (e.g., `var(--text)`, `var(--button-primary-bg)`)
2. **Performance Optimization** - All fluid animations must use hardware-accelerated properties (`transform`, `opacity`) and include `will-change` hints
3. **Accessibility Preservation** - Surreal motifs must never reduce text contrast ratio below WCAG 2.1 AA standards
4. **Non-Interference** - Ornamental elements must have `pointer-events: none` and not overlap interactive elements
5. **Layer Independence** - Ornamental layer must be completely removable without affecting functionality
6. **Motion Token Usage** - All animations must reference motion tokens (e.g., `var(--motion-fluid)`) rather than hardcoded easing values
7. **Fallback Support** - Provide reduced-motion preferences for users who prefer minimal animation

### AI Agent Rules
1. **Token verification** - Before implementing UI changes, AI agents must verify that required tokens exist in the Design System
2. **Missing token protocol** - If a required token doesn't exist, the agent must:
   - Add the token to the appropriate tier (Primitive → Semantic → Component)
   - Document the token's purpose and usage
   - Update this DESIGN_SYSTEM_STRATEGY.md if the token represents a new pattern
3. **Consistency checks** - AI agents must check for similar existing patterns before creating new tokens
4. **Documentation updates** - Any new component patterns must be documented in the Components section of this file

---

## Implementation Guide

Step-by-step process for adding new design tokens and UI components to the Lexicon Master design system.

### Step 1: Define Primitive Token
Add the base value to the appropriate primitive category in `src/app/styles/index.css`:

```css
:root {
  /* Example: Adding a new warning color */
  --warning: #ffa726;
}
```

### Step 2: Assign Semantic Value
Create a functional name for the primitive in the semantics section:

```css
:root {
  /* Semantic mapping */
  --alert-warning-bg: var(--warning);
  --alert-warning-text: var(--text);
}
```

### Step 3: Apply to Component
Use the semantic token in your component:

```tsx
<div className="alert alert--warning" style={{ 
  backgroundColor: 'var(--alert-warning-bg)',
  color: 'var(--alert-warning-text)'
}}>
  Warning message
</div>
```

### Step 4: Document Component Pattern
Add the component specification to the Components section of this file:

```typescript
components: {
  alert: {
    warning: {
      bg: semantics.alertWarningBg,
      text: semantics.alertWarningText,
      padding: spacing.md,
      borderRadius: borderRadius.sm,
    }
  }
}
```

### Step 5: Test Accessibility
- Verify contrast ratios meet WCAG AA standards
- Test keyboard navigation
- Test with screen reader
- Test across different viewport sizes

---

## Migration Path

The current implementation uses CSS custom properties in `src/app/styles/index.css`. Future migration to a TypeScript-based Design System (`src/shared/config/DesignSystem.ts`) should:

1. **Maintain token structure** - Keep the three-tier hierarchy (Primitives → Semantics → Components)
2. **Preserve existing values** - Map current CSS variables to TypeScript tokens
3. **Add type safety** - Leverage TypeScript for token validation
4. **Enable runtime theming** - Support for dynamic theme switching if needed
5. **Generate CSS from tokens** - Use build tools to generate CSS from TypeScript tokens

---

## Maintenance & Governance

### Token Modification Process
1. **Propose change** - Document the reason for token modification
2. **Impact analysis** - Identify all components using the token
3. **Deprecation period** - Maintain old tokens for at least one major version
4. **Migration guide** - Provide clear instructions for updating components
5. **Update documentation** - Keep this file and component docs synchronized

### Review Frequency
- Design System review: Quarterly
- Accessibility audit: Monthly
- Performance review: As needed (when adding new tokens/components)

---

## Appendix: Current Token Inventory

### Colors (Primitives)
- `--bg`, `--bg-panel`, `--bg-panel-2`
- `--accent`, `--accent-strong`
- `--text`, `--text-muted`
- `--correct`, `--incorrect`

### Spacing (Primitives)
- Defined via CSS spacing utilities (rem-based)

### Typography (Primitives)
- System font stack
- Size scale: xs, sm, md, lg, xl, xxl
- Weight scale: normal, medium, semibold, bold

### Motion (Primitives)
- Easing curves: fluid, liquid, surreal
- Durations: fast (150ms), medium (300ms), slow (500ms)
- Transforms: scale, translate, rotate (performance-optimized)

### Components (Current)
- Button: Primary, Ghost variants
- Panel: Standard panel with centering
- Game Card: Large, Solo, Versus variants
- Landing Page: Guest CTA, Register hook

### Surreal Elements (New)
- Fluid shapes with organic border-radius
- Liquid animations with motion tokens
- Ornamental layer (non-interactive, aesthetic only)
- Performance-optimized particle systems

---

**Last Updated**: 2026-07-16  
**Maintained By**: Development Team  
**Version**: 2.0.0 (Surreal Liquid Aesthetic Integration)
