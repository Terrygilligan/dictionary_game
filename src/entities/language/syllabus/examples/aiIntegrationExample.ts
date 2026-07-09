/**
 * AI Integration Example
 * 
 * Demonstrates how the AdaptiveDifficultyAgent and other AI agents
 * can integrate with the LanguageSyllabus service for curriculum-aware
 * difficulty adjustment and personalized learning paths.
 */

import { languageSyllabusService } from '../service.ts'
import { DevelopmentalStage } from '../../model/state.ts'
import type { StageData, ConceptMapping } from '../service.ts'

/**
 * AI-Enhanced Adaptive Difficulty Agent
 * 
 * Extends the basic AdaptiveDifficultyAgent with syllabus-aware
 * curriculum management for truly personalized learning experiences.
 */
export class SyllabusAwareAdaptiveAgent {
  private readonly syllabusService = languageSyllabusService
  
  /**
   * Get curriculum-aware difficulty adjustment
   * 
   * @param tenantId - Tenant identifier
   * @param languageCode - Target language code
   * @param currentStage - Current developmental stage
   * @param performanceScore - Current performance score (0-100)
   * @returns Difficulty adjustment with curriculum context
   */
  async getCurriculumAwareDifficultyAdjustment(
    tenantId: string,
    languageCode: string,
    currentStage: DevelopmentalStage,
    performanceScore: number
  ): Promise<{
    newDifficulty: number
    previousDifficulty: number
    adjustmentReason: string
    curriculumContext: {
      stageProgress: number
      conceptsMastered: number
      totalConcepts: number
      nextStageReady: boolean
      recommendedTopics: string[]
    }
  }> {
    try {
      // Get current stage data
      const stageData = await this.syllabusService.getStageData(languageCode, currentStage)
      
      // Calculate stage progress
      const stageProgress = this.calculateStageProgress(stageData, performanceScore)
      
      // Determine if ready for next stage
      const nextStageReady = this.isReadyForNextStage(stageData, performanceScore)
      
      // Get curriculum-aware difficulty adjustment
      const adjustment = this.calculateCurriculumAwareAdjustment(
        stageData,
        performanceScore,
        stageProgress
      )
      
      // Get recommended topics based on performance
      const recommendedTopics = await this.getRecommendedTopics(
        languageCode,
        currentStage,
        performanceScore,
        adjustment.newDifficulty
      )
      
      return {
        ...adjustment,
        curriculumContext: {
          stageProgress,
          conceptsMastered: Math.floor(stageData.totalConcepts * (stageProgress / 100)),
          totalConcepts: stageData.totalConcepts,
          nextStageReady,
          recommendedTopics
        }
      }
    } catch (error) {
      console.error('❌ [AI] Failed to get curriculum-aware adjustment:', error)
      throw error
    }
  }
  
  /**
   * Get personalized learning path based on performance and curriculum
   * 
   * @param languageCode - Target language code
   * @param currentStage - Current developmental stage
   * @param performanceScore - Current performance score
   * @param missedWords - Words the learner is struggling with
   * @returns Personalized learning path recommendations
   */
  async getPersonalizedLearningPath(
    languageCode: string,
    currentStage: DevelopmentalStage,
    performanceScore: number,
    missedWords: readonly string[]
  ): Promise<{
    recommendedConcepts: readonly ConceptMapping[]
    focusTopics: string[]
    estimatedTime: number
    learningObjectives: string[]
  }> {
    try {
      const stageData = await this.syllabusService.getStageData(languageCode, currentStage)
      
      // Get concepts appropriate for current performance level
      const difficultyLevel = this.mapPerformanceToDifficulty(performanceScore)
      const appropriateConcepts = await this.syllabusService.getConceptsByDifficulty(
        languageCode,
        currentStage,
        difficultyLevel,
        8 // Get 8 concepts per session
      )
      
      // Prioritize concepts that address missed words
      const prioritizedConcepts = this.prioritizeConceptsForMissedWords(
        appropriateConcepts,
        missedWords,
        stageData
      )
      
      // Get focus topics based on prioritized concepts
      const focusTopics = this.getFocusTopicsFromConcepts(prioritizedConcepts, stageData)
      
      // Calculate estimated learning time
      const estimatedTime = stageData.sessionLength * Math.ceil(prioritizedConcepts.length / 4)
      
      // Generate learning objectives
      const learningObjectives = this.generateLearningObjectives(
        prioritizedConcepts,
        performanceScore,
        missedWords
      )
      
      return {
        recommendedConcepts: prioritizedConcepts,
        focusTopics,
        estimatedTime,
        learningObjectives
      }
    } catch (error) {
      console.error('❌ [AI] Failed to generate personalized learning path:', error)
      throw error
    }
  }
  
  /**
   * Get cultural context for learning recommendations
   * 
   * @param languageCode - Target language code
   * @returns Cultural context information
   */
  async getCulturalContext(languageCode: string): Promise<{
    learningApproach: string
    culturalNotes: readonly string[]
    commonDifficulties: readonly string[]
    recommendations: string[]
  }> {
    try {
      const syllabus = await this.syllabusService.getSyllabusData(languageCode)
      
      // Generate AI recommendations based on cultural context
      const recommendations = this.generateCulturalRecommendations(syllabus)
      
      return {
        learningApproach: syllabus.culturalContext.learningApproach,
        culturalNotes: syllabus.culturalContext.culturalNotes,
        commonDifficulties: syllabus.culturalContext.commonDifficulties,
        recommendations
      }
    } catch (error) {
      console.error('❌ [AI] Failed to get cultural context:', error)
      throw error
    }
  }
  
  /**
   * Calculate stage progress based on performance and curriculum
   */
  private calculateStageProgress(stageData: StageData, performanceScore: number): number {
    // Combine performance score with curriculum completion
    const baseProgress = performanceScore
    
    // Adjust based on assessment criteria
    const accuracyBonus = performanceScore >= stageData.assessmentCriteria.accuracyThreshold ? 10 : -5
    const masteryBonus = performanceScore >= (stageData.assessmentCriteria.conceptMasteryThreshold / stageData.totalConcepts * 100) ? 10 : -5
    
    return Math.max(0, Math.min(100, baseProgress + accuracyBonus + masteryBonus))
  }
  
  /**
   * Determine if learner is ready for next developmental stage
   */
  private isReadyForNextStage(stageData: StageData, performanceScore: number): boolean {
    return (
      performanceScore >= stageData.assessmentCriteria.accuracyThreshold &&
      performanceScore >= 75 // Additional performance threshold
    )
  }
  
  /**
   * Calculate curriculum-aware difficulty adjustment
   */
  private calculateCurriculumAwareAdjustment(
    stageData: StageData,
    performanceScore: number,
    stageProgress: number
  ): {
    newDifficulty: number
    previousDifficulty: number
    adjustmentReason: string
  } {
    const [minDifficulty, maxDifficulty] = [1, 5] // Concept difficulty range
    
    let newDifficulty = Math.floor((minDifficulty + maxDifficulty) / 2)
    let adjustmentReason = 'Maintaining current difficulty'
    
    // High performance - increase difficulty
    if (performanceScore >= 85 && stageProgress >= 80) {
      newDifficulty = Math.min(maxDifficulty, newDifficulty + 1)
      adjustmentReason = `High performance (${performanceScore}%) and strong stage progress (${stageProgress}%)`
    }
    // Low performance - decrease difficulty
    else if (performanceScore <= 45 || stageProgress <= 40) {
      newDifficulty = Math.max(minDifficulty, newDifficulty - 1)
      adjustmentReason = `Performance needs improvement (${performanceScore}%) and stage progress (${stageProgress}%)`
    }
    // Moderate performance - maintain with focus
    else {
      adjustmentReason = `Steady performance (${performanceScore}%) with stage progress (${stageProgress}%)`
    }
    
    return {
      newDifficulty,
      previousDifficulty: 3, // Default previous difficulty
      adjustmentReason
    }
  }
  
  /**
   * Get recommended topics based on performance and difficulty
   */
  private async getRecommendedTopics(
    languageCode: string,
    currentStage: DevelopmentalStage,
    performanceScore: number,
    difficultyLevel: number
  ): Promise<string[]> {
    try {
      const stageData = await this.syllabusService.getStageData(languageCode, currentStage)
      
      // Filter topics based on difficulty and performance
      return stageData.topics
        .filter(topic => {
          // Check if topic has appropriate difficulty concepts
          const topicConcepts = stageData.concepts.filter(c => 
            topic.concepts.includes(c.englishConcept) && c.difficulty <= difficultyLevel
          )
          return topicConcepts.length > 0
        })
        .map(topic => topic.name)
        .slice(0, 3) // Top 3 recommended topics
    } catch (error) {
      console.error('❌ [AI] Failed to get recommended topics:', error)
      return []
    }
  }
  
  /**
   * Map performance score to difficulty level
   */
  private mapPerformanceToDifficulty(performanceScore: number): number {
    if (performanceScore >= 90) return 5
    if (performanceScore >= 80) return 4
    if (performanceScore >= 70) return 3
    if (performanceScore >= 60) return 2
    return 1
  }
  
  /**
   * Prioritize concepts based on missed words
   */
  private prioritizeConceptsForMissedWords(
    concepts: readonly ConceptMapping[],
    missedWords: readonly string[],
    stageData: StageData
  ): readonly ConceptMapping[] {
    if (missedWords.length === 0) {
      return concepts
    }
    
    // Find concepts that address missed words
    const prioritizedConcepts = concepts.map(concept => {
      const isMissedWord = missedWords.includes(concept.englishConcept)
      const relatedMissedWords = concept.relatedConcepts?.filter(rc => missedWords.includes(rc)) || []
      
      return {
        ...concept,
        priority: isMissedWord ? 10 : relatedMissedWords.length * 5
      }
    })
    
    // Sort by priority (highest first)
    return prioritizedConcepts
      .sort((a, b) => (b as any).priority - (a as any).priority)
      .slice(0, 8)
  }
  
  /**
   * Get focus topics from prioritized concepts
   */
  private getFocusTopicsFromConcepts(
    concepts: readonly ConceptMapping[],
    stageData: StageData
  ): string[] {
    const conceptIds = concepts.map(c => c.englishConcept)
    
    return stageData.topics
      .filter(topic => topic.concepts.some(conceptId => conceptIds.includes(conceptId)))
      .map(topic => topic.name)
      .slice(0, 3)
  }
  
  /**
   * Generate learning objectives based on concepts and performance
   */
  private generateLearningObjectives(
    concepts: readonly ConceptMapping[],
    performanceScore: number,
    missedWords: readonly string[]
  ): string[] {
    const objectives: string[] = []
    
    // Basic objectives
    objectives.push('Master vocabulary for current developmental stage')
    objectives.push('Improve pronunciation and comprehension')
    
    // Performance-based objectives
    if (performanceScore < 70) {
      objectives.push('Focus on accuracy and retention')
      objectives.push('Practice with missed words for reinforcement')
    } else {
      objectives.push('Challenge with more complex concepts')
      objectives.push('Develop fluency and contextual understanding')
    }
    
    // Concept-specific objectives
    if (missedWords.length > 0) {
      objectives.push(`Address ${missedWords.length} challenging words`)
    }
    
    // Cultural objectives
    objectives.push('Understand cultural context of language usage')
    
    return objectives
  }
  
  /**
   * Generate cultural recommendations based on syllabus data
   */
  private generateCulturalRecommendations(syllabus: any): string[] {
    const recommendations: string[] = []
    
    // Based on cultural notes
    if (syllabus.culturalContext.culturalNotes.length > 0) {
      recommendations.push('Focus on cultural context for deeper understanding')
    }
    
    // Based on common difficulties
    if (syllabus.culturalContext.commonDifficulties.length > 0) {
      recommendations.push('Address common learning challenges specific to this language')
    }
    
    // General recommendations
    recommendations.push('Practice with native speakers when possible')
    recommendations.push('Immerse in cultural materials (music, films, literature)')
    recommendations.push('Use language in real-world contexts')
    
    return recommendations
  }
}

/**
 * Example usage of the SyllabusAwareAdaptiveAgent
 */
export async function demonstrateAIIntegration(): Promise<void> {
  console.log('🤖 [AI] Syllabus-Aware Adaptive Agent Integration')
  console.log('=' .repeat(55))
  
  const agent = new SyllabusAwareAdaptiveAgent()
  
  // Example 1: Bulgarian learner in TODDLER stage with good performance
  console.log('\n📊 Example 1: Bulgarian Learner - TODDLER Stage')
  console.log('-'.repeat(40))
  
  const adjustment1 = await agent.getCurriculumAwareDifficultyAdjustment(
    'tenant_123',
    'bg',
    'TODDLER',
    85 // Good performance
  )
  
  console.log('Difficulty Adjustment:')
  console.log(`  New Difficulty: ${adjustment1.newDifficulty}`)
  console.log(`  Reason: ${adjustment1.adjustmentReason}`)
  console.log(`  Stage Progress: ${adjustment1.curriculumContext.stageProgress}%`)
  console.log(`  Concepts Mastered: ${adjustment1.curriculumContext.conceptsMastered}/${adjustment1.curriculumContext.totalConcepts}`)
  console.log(`  Ready for Next Stage: ${adjustment1.curriculumContext.nextStageReady}`)
  console.log(`  Recommended Topics: ${adjustment1.curriculumContext.recommendedTopics.join(', ')}`)
  
  // Example 2: Personalized learning path
  console.log('\n🎯 Example 2: Personalized Learning Path')
  console.log('-'.repeat(40))
  
  const learningPath = await agent.getPersonalizedLearningPath(
    'bg',
    'TODDLER',
    85,
    ['mother', 'eat'] // Missed words
  )
  
  console.log('Learning Path:')
  console.log(`  Recommended Concepts: ${learningPath.recommendedConcepts.length}`)
  console.log(`  Focus Topics: ${learningPath.focusTopics.join(', ')}`)
  console.log(`  Estimated Time: ${learningPath.estimatedTime} minutes`)
  console.log(`  Learning Objectives: ${learningPath.learningObjectives.length}`)
  
  learningPath.recommendedConcepts.forEach((concept, index) => {
    console.log(`    ${index + 1}. ${concept.englishConcept} → ${concept.targetTerm} (${concept.partOfSpeech})`)
  })
  
  // Example 3: Cultural context
  console.log('\n🌍 Example 3: Cultural Context')
  console.log('-'.repeat(40))
  
  const culturalContext = await agent.getCulturalContext('bg')
  
  console.log('Cultural Context:')
  console.log(`  Learning Approach: ${culturalContext.learningApproach}`)
  console.log(`  Cultural Notes: ${culturalContext.culturalNotes.length}`)
  console.log(`  Common Difficulties: ${culturalContext.commonDifficulties.length}`)
  console.log(`  AI Recommendations: ${culturalContext.recommendations.length}`)
  
  culturalContext.recommendations.forEach((rec, index) => {
    console.log(`    ${index + 1}. ${rec}`)
  })
  
  // Example 4: French learner comparison
  console.log('\n🇫🇷 Example 4: French Learner Comparison')
  console.log('-'.repeat(40))
  
  const adjustment2 = await agent.getCurriculumAwareDifficultyAdjustment(
    'tenant_456',
    'fr',
    'SCHOOLER',
    65 // Moderate performance
  )
  
  console.log('French Learner Adjustment:')
  console.log(`  New Difficulty: ${adjustment2.newDifficulty}`)
  console.log(`  Reason: ${adjustment2.adjustmentReason}`)
  console.log(`  Stage Progress: ${adjustment2.curriculumContext.stageProgress}%`)
  
  console.log('\n✅ AI Integration Examples Complete!')
  console.log('=' .repeat(55))
  console.log('🎯 Key Features Demonstrated:')
  console.log('  ✅ Curriculum-aware difficulty adjustment')
  console.log('  ✅ Personalized learning path generation')
  console.log('  ✅ Cultural context integration')
  console.log('  ✅ Multi-lingual support (Bulgarian, French)')
  console.log('  ✅ Developmental stage progression tracking')
  console.log('  ✅ Performance-based recommendations')
}

/**
 * Run AI integration examples
 */
export function runAIIntegrationExamples(): void {
  demonstrateAIIntegration()
    .then(() => {
      console.log('\n🚀 Syllabus-Aware AI Integration Ready!')
    })
    .catch(error => {
      console.error('❌ Error running examples:', error)
    })
}
