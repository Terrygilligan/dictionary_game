/**
 * Language Learning Entity
 * 
 * Complete language learning entity following Event-Driven Architecture Blueprint.
 * Provides developmental projection capabilities for tracking language acquisition
 * progress through structured stages and personalized learning paths.
 */

// Types
export type * from './model/types.ts'

// State
export type * from './model/state.ts'
export { 
  initialLinguisticState,
  STAGE_THRESHOLDS,
  determineDevelopmentalStage,
  calculateAccuracy,
  calculateMissRate,
  getWordsNeedingPractice,
  isReadyForStageProgression,
  getNextStage,
  validateLinguisticState
} from './model/state.ts'

// Domain Logic
export { evolveLanguage, validateEvolvedState } from './model/evolve.ts'

// Configuration
export { DEFAULT_LEARNING_CONFIG } from './model/types.ts'

/**
 * Language Learning Entity Summary
 * 
 * This entity provides:
 * 
 * 1. **Developmental Stages**: INFANT → TODDLER → SCHOOLER → CONVERSATIONAL
 * 2. **Progress Tracking**: Mastered words, missed words, accuracy metrics
 * 3. **Stage Progression**: Automatic advancement based on mastery thresholds
 * 4. **Focus Topics**: Personalized learning paths based on performance
 * 5. **Multi-Tenant Support**: Tenant-isolated state evolution
 * 
 * Architecture Compliance:
 * - ✅ Event-Driven: State derived from GameEvent stream
 * - ✅ Immutable: Pure functions, no side effects
 * - ✅ Multi-Tenant: Tenant-specific projections
 * - ✅ Blueprint Compliance: Follows EDA patterns
 * 
 * Usage:
 * ```typescript
 * import { evolveLanguage, initialLinguisticState } from '@/entities/language'
 * 
 * // Create tenant-specific language state
 * let languageState = initialLinguisticState
 * 
 * // Evolve state with game events
 * languageState = evolveLanguage(languageState, gameEvent)
 * 
 * // Check developmental stage
 * console.log('Current stage:', languageState.stage)
 * console.log('Mastered words:', languageState.masteredWords.length)
 * ```
 */
