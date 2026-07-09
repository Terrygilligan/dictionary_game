/**
 * Language Syllabus Service
 * 
 * Data-driven curriculum service providing multi-lingual syllabus management
 * following Event-Driven Architecture Blueprint patterns.
 * 
 * This service loads language-specific syllabus data and provides
 * curriculum retrieval for different developmental stages and proficiency levels.
 */

import { DevelopmentalStage } from '../model/state.ts'

/**
 * Word/Concept mapping for language learning
 * Defines the relationship between English concepts and target language terms
 */
export interface ConceptMapping {
  /** English concept identifier */
  readonly englishConcept: string
  /** Target language term/translation */
  readonly targetTerm: string
  /** Pronunciation guide (optional) */
  readonly pronunciation?: string
  /** Part of speech */
  readonly partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection'
  /** Difficulty level within the stage (1-5) */
  readonly difficulty: number
  /** Example usage in target language */
  readonly example?: string
  /** Cultural notes or context */
  readonly culturalNotes?: string
  /** Related concepts for learning connections */
  readonly relatedConcepts?: readonly string[]
}

/**
 * Learning topic within a developmental stage
 * Groups related concepts for focused learning
 */
export interface Topic {
  /** Topic identifier */
  readonly id: string
  /** Topic display name in target language */
  readonly name: string
  /** Topic description */
  readonly description: string
  /** List of concept IDs included in this topic */
  readonly concepts: readonly string[]
  /** Estimated learning time in minutes */
  readonly estimatedTime: number
  /** Prerequisite topics */
  readonly prerequisites?: readonly string[]
  /** Learning objectives */
  readonly objectives: readonly string[]
}

/**
 * Developmental stage curriculum data
 * Defines the learning content and structure for each proficiency level
 */
export interface StageData {
  /** Developmental stage */
  readonly stage: DevelopmentalStage
  /** Stage description */
  readonly description: string
  /** List of topics in this stage */
  readonly topics: readonly Topic[]
  /** All concept mappings for this stage */
  readonly concepts: readonly ConceptMapping[]
  /** Total concepts to master in this stage */
  readonly totalConcepts: number
  /** Recommended session length in minutes */
  readonly sessionLength: number
  /** Prerequisites for this stage */
  readonly prerequisites: readonly DevelopmentalStage[]
  /** Assessment criteria */
  readonly assessmentCriteria: {
    readonly accuracyThreshold: number
    readonly conceptMasteryThreshold: number
    readonly timeLimit?: number
  }
}

/**
 * Complete syllabus data for a language
 * Contains all stages and curriculum information
 */
export interface SyllabusData {
  /** Language code (ISO 639-1) */
  readonly languageCode: string
  /** Language name in English */
  readonly languageName: string
  /** Language name in native script */
  readonly nativeName: string
  /** Syllabus version */
  readonly version: string
  /** Last updated timestamp */
  readonly lastUpdated: number
  /** All developmental stages */
  readonly stages: readonly StageData[]
  /** Global configuration */
  readonly configuration: {
    readonly defaultSessionLength: number
    readonly maxConceptsPerSession: number
    readonly repetitionThreshold: number
    readonly masteryThreshold: number
  }
  /** Cultural context information */
  readonly culturalContext: {
    readonly learningApproach: string
    readonly culturalNotes: readonly string[]
    readonly commonDifficulties: readonly string[]
  }
}

/**
 * Language Syllabus Service
 * 
 * Provides data-driven curriculum management with multi-lingual support.
 * Following Event-Driven Architecture Blueprint:
 * - Immutable data structures
 * - Pure functions for data retrieval
 * - Multi-tenant ready (tenant context handled by callers)
 * - AI agent integration ready
 */
export class LanguageSyllabusService {
  private readonly syllabusCache = new Map<string, SyllabusData>()
  private readonly loadingPromises = new Map<string, Promise<SyllabusData>>()

  /**
   * Get stage data for a specific language and developmental stage
   * 
   * @param languageCode - ISO 639-1 language code (e.g., 'bg', 'fr', 'es')
   * @param stage - Developmental stage for curriculum retrieval
   * @returns StageData for the specified language and stage
   * @throws Error if language or stage not found
   */
  async getStageData(languageCode: string, stage: DevelopmentalStage): Promise<StageData> {
    const syllabus = await this.getSyllabusData(languageCode)
    const stageData = syllabus.stages.find(s => s.stage === stage)
    
    if (!stageData) {
      throw new Error(`Stage ${stage} not found in syllabus for language ${languageCode}`)
    }
    
    return stageData
  }

  /**
   * Get complete syllabus data for a language
   * 
   * @param languageCode - ISO 639-1 language code
   * @returns Complete SyllabusData for the language
   */
  async getSyllabusData(languageCode: string): Promise<SyllabusData> {
    // Check cache first
    if (this.syllabusCache.has(languageCode)) {
      return this.syllabusCache.get(languageCode)!
    }

    // Check if already loading
    if (this.loadingPromises.has(languageCode)) {
      return this.loadingPromises.get(languageCode)!
    }

    // Load syllabus data
    const loadingPromise = this.loadSyllabusData(languageCode)
    this.loadingPromises.set(languageCode, loadingPromise)

    try {
      const syllabus = await loadingPromise
      this.syllabusCache.set(languageCode, syllabus)
      return syllabus
    } finally {
      this.loadingPromises.delete(languageCode)
    }
  }

  /**
   * Load syllabus data from JSON file
   * 
   * @param languageCode - ISO 639-1 language code
   * @returns Promise<SyllabusData> loaded syllabus data
   */
  private async loadSyllabusData(languageCode: string): Promise<SyllabusData> {
    try {
      // Dynamic import based on language code
      const syllabusModule = await import(`./data/${languageCode}.json`)
      const syllabusData = syllabusModule.default as SyllabusData
      
      // Validate syllabus data structure
      this.validateSyllabusData(syllabusData, languageCode)
      
      console.log(`📚 [SYLLABUS] Loaded syllabus for ${languageCode}: ${syllabusData.languageName}`)
      return syllabusData
    } catch (error) {
      console.error(`❌ [SYLLABUS] Failed to load syllabus for ${languageCode}:`, error)
      throw new Error(`Syllabus not available for language: ${languageCode}`)
    }
  }

  /**
   * Get available languages
   * 
   * @returns Array of available language codes
   */
  getAvailableLanguages(): readonly string[] {
    // In a real implementation, this would scan the data directory
    // For now, return known supported languages
    return ['en', 'bg', 'fr', 'es', 'de', 'it', 'pt', 'nl']
  }

  /**
   * Get concept mapping for a specific concept
   * 
   * @param languageCode - Language code
   * @param stage - Developmental stage
   * @param conceptId - English concept identifier
   * @returns ConceptMapping for the specified concept
   */
  async getConceptMapping(
    languageCode: string, 
    stage: DevelopmentalStage, 
    conceptId: string
  ): Promise<ConceptMapping> {
    const stageData = await this.getStageData(languageCode, stage)
    const concept = stageData.concepts.find(c => c.englishConcept === conceptId)
    
    if (!concept) {
      throw new Error(`Concept ${conceptId} not found in stage ${stage} for language ${languageCode}`)
    }
    
    return concept
  }

  /**
   * Get topic data for a specific topic
   * 
   * @param languageCode - Language code
   * @param stage - Developmental stage
   * @param topicId - Topic identifier
   * @returns Topic data for the specified topic
   */
  async getTopicData(
    languageCode: string, 
    stage: DevelopmentalStage, 
    topicId: string
  ): Promise<Topic> {
    const stageData = await this.getStageData(languageCode, stage)
    const topic = stageData.topics.find(t => t.id === topicId)
    
    if (!topic) {
      throw new Error(`Topic ${topicId} not found in stage ${stage} for language ${languageCode}`)
    }
    
    return topic
  }

  /**
   * Get concepts for adaptive difficulty selection
   * 
   * @param languageCode - Language code
   * @param stage - Developmental stage
   * @param difficultyLevel - Difficulty level (1-5)
   * @param count - Number of concepts to retrieve
   * @returns Array of concept mappings filtered by difficulty
   */
  async getConceptsByDifficulty(
    languageCode: string,
    stage: DevelopmentalStage,
    difficultyLevel: number,
    count: number
  ): Promise<readonly ConceptMapping[]> {
    const stageData = await this.getStageData(languageCode, stage)
    
    return stageData.concepts
      .filter(c => c.difficulty <= difficultyLevel)
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, count)
  }

  /**
   * Get prerequisite concepts for a given concept
   * 
   * @param languageCode - Language code
   * @param stage - Developmental stage
   * @param conceptId - Concept identifier
   * @returns Array of prerequisite concept mappings
   */
  async getPrerequisiteConcepts(
    languageCode: string,
    stage: DevelopmentalStage,
    conceptId: string
  ): Promise<readonly ConceptMapping[]> {
    const concept = await this.getConceptMapping(languageCode, stage, conceptId)
    const stageData = await this.getStageData(languageCode, stage)
    
    if (!concept.relatedConcepts || concept.relatedConcepts.length === 0) {
      return []
    }
    
    return stageData.concepts.filter(c => 
      concept.relatedConcepts!.includes(c.englishConcept)
    )
  }

  /**
   * Validate syllabus data structure
   * 
   * @param syllabusData - Syllabus data to validate
   * @param languageCode - Language code for error reporting
   */
  private validateSyllabusData(syllabusData: SyllabusData, languageCode: string): void {
    const requiredFields = ['languageCode', 'languageName', 'nativeName', 'version', 'stages']
    
    for (const field of requiredFields) {
      if (!(field in syllabusData)) {
        throw new Error(`Invalid syllabus data for ${languageCode}: missing field '${field}'`)
      }
    }
    
    if (!Array.isArray(syllabusData.stages) || syllabusData.stages.length === 0) {
      throw new Error(`Invalid syllabus data for ${languageCode}: stages must be a non-empty array`)
    }
    
    // Validate each stage
    for (const stage of syllabusData.stages) {
      this.validateStageData(stage, languageCode)
    }
  }

  /**
   * Validate individual stage data
   * 
   * @param stageData - Stage data to validate
   * @param languageCode - Language code for error reporting
   */
  private validateStageData(stageData: StageData, languageCode: string): void {
    const requiredFields = ['stage', 'description', 'topics', 'concepts']
    
    for (const field of requiredFields) {
      if (!(field in stageData)) {
        throw new Error(`Invalid stage data for ${languageCode}: missing field '${field}'`)
      }
    }
    
    if (!Array.isArray(stageData.topics)) {
      throw new Error(`Invalid stage data for ${languageCode}: topics must be an array`)
    }
    
    if (!Array.isArray(stageData.concepts)) {
      throw new Error(`Invalid stage data for ${languageCode}: concepts must be an array`)
    }
    
    // Validate concepts
    for (const concept of stageData.concepts) {
      this.validateConceptMapping(concept, languageCode, stageData.stage)
    }
  }

  /**
   * Validate concept mapping
   * 
   * @param concept - Concept mapping to validate
   * @param languageCode - Language code for error reporting
   * @param stage - Stage for error reporting
   */
  private validateConceptMapping(concept: ConceptMapping, languageCode: string, stage: DevelopmentalStage): void {
    const requiredFields = ['englishConcept', 'targetTerm', 'partOfSpeech', 'difficulty']
    
    for (const field of requiredFields) {
      if (!(field in concept)) {
        throw new Error(`Invalid concept in ${languageCode} stage ${stage}: missing field '${field}'`)
      }
    }
    
    if (concept.difficulty < 1 || concept.difficulty > 5) {
      throw new Error(`Invalid concept difficulty in ${languageCode} stage ${stage}: must be 1-5`)
    }
  }

  /**
   * Clear syllabus cache (useful for testing or updates)
   * 
   * @param languageCode - Optional specific language to clear, or clear all if not provided
   */
  clearCache(languageCode?: string): void {
    if (languageCode) {
      this.syllabusCache.delete(languageCode)
      this.loadingPromises.delete(languageCode)
    } else {
      this.syllabusCache.clear()
      this.loadingPromises.clear()
    }
  }

  /**
   * Get syllabus statistics
   * 
   * @param languageCode - Language code
   * @returns Statistics about the syllabus
   */
  async getSyllabusStatistics(languageCode: string): Promise<{
    totalStages: number
    totalTopics: number
    totalConcepts: number
    averageConceptsPerStage: number
    averageTopicsPerStage: number
  }> {
    const syllabus = await this.getSyllabusData(languageCode)
    
    const totalConcepts = syllabus.stages.reduce((sum, stage) => sum + stage.concepts.length, 0)
    const totalTopics = syllabus.stages.reduce((sum, stage) => sum + stage.topics.length, 0)
    
    return {
      totalStages: syllabus.stages.length,
      totalTopics,
      totalConcepts,
      averageConceptsPerStage: Math.round(totalConcepts / syllabus.stages.length),
      averageTopicsPerStage: Math.round(totalTopics / syllabus.stages.length)
    }
  }
}

/**
 * Singleton instance of the LanguageSyllabusService
 * Following Event-Driven Architecture Blueprint patterns
 */
export const languageSyllabusService = new LanguageSyllabusService()

/**
 * Factory function for creating LanguageSyllabusService instances
 * Useful for testing or dependency injection
 */
export function createLanguageSyllabusService(): LanguageSyllabusService {
  return new LanguageSyllabusService()
}
