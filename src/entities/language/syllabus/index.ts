/**
 * Language Syllabus Module
 * 
 * Data-driven curriculum management for multi-lingual language learning
 * following Event-Driven Architecture Blueprint patterns.
 * 
 * This module provides:
 * - Multi-lingual syllabus data loading
 * - Developmental stage-specific curriculum
 * - AI agent integration capabilities
 * - Tenant-ready service architecture
 */

// Service and main interfaces
export {
  LanguageSyllabusService,
  languageSyllabusService,
  createLanguageSyllabusService
} from './service.ts'

// Type definitions
export type {
  SyllabusData,
  StageData,
  Topic,
  ConceptMapping
} from './service.ts'

/**
 * Language Syllabus Module Summary
 * 
 * This module provides comprehensive curriculum management for language learning:
 * 
 * 🌍 **Multi-Lingual Support**: Dynamic loading of language-specific syllabus data
 * 📚 **Developmental Stages**: Curriculum organized by INFANT → TODDLER → SCHOOLER → CONVERSATIONAL
 * 🎯 **AI Integration**: Ready for AdaptiveDifficultyAgent and other AI agents
 * 🏢 **Multi-Tenant Ready**: Service architecture supports tenant isolation
 * 📊 **Data-Driven**: JSON-based syllabus files for easy content management
 * 🔧 **Extensible**: Easy to add new languages and stages
 * 
 * Usage Examples:
 * ```typescript
 * import { languageSyllabusService } from '@/entities/language/syllabus'
 * 
 * // Get stage data for Bulgarian INFANT stage
 * const stageData = await languageSyllabusService.getStageData('bg', 'INFANT')
 * 
 * // Get concepts for adaptive difficulty
 * const concepts = await languageSyllabusService.getConceptsByDifficulty('bg', 'TODDLER', 3, 10)
 * 
 * // AI Agent Integration
 * const agent = createAdaptiveDifficultyAgent()
 * const curriculum = await languageSyllabusService.getSyllabusData(agent.targetLanguage)
 * ```
 * 
 * Architecture Compliance:
 * - ✅ Event-Driven: Service ready for event-driven integration
 * - ✅ Multi-Tenant: Tenant context handled by callers
 * - ✅ Immutable: Pure functions and immutable data
 * - ✅ AI-Ready: Designed for AI agent consumption
 * - ✅ Blueprint Compliance: Follows EDA patterns
 * 
 * Available Languages:
 * - 🇧🇬 Bulgarian (bg) - Complete with cultural context
 * - 🇫🇷 French (fr) - Complete with cultural context
 * - 🇬🇧 German (de) - Planned
 * - 🇪🇸 Spanish (es) - Planned
 * - 🇮🇹 Italian (it) - Planned
 * - 🇵🇹 Portuguese (pt) - Planned
 * - 🇳🇱 Dutch (nl) - Planned
 * 
 * File Structure:
 * ```
 * src/entities/language/syllabus/
 * ├── service.ts              # Main syllabus service
 * ├── index.ts                # Module exports
 * ├── data/                   # Syllabus data files
 * │   ├── bg.json             # Bulgarian syllabus
 * │   ├── fr.json             # French syllabus
 * │   └── [language].json     # Additional languages
 * └── README.md               # Detailed documentation
 * ```
 */
