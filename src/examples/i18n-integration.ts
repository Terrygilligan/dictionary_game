/**
 * Example demonstrating the multilingual Lexicon Master integration
 * This file shows how to use the i18n service with the lexicon entity
 */

import { initializeI18n, i18nService } from '@/shared/lib/i18n/i18nService'
import { getLocalizedWordById, initializeWordTranslations } from '@/entities/lexicon'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

/**
 * Example: Initialize the multilingual system
 */
export async function initializeMultilingualSystem() {
  // Initialize i18n service with user's preferred language
  await initializeI18n()
  
  // Initialize word translations for the lexicon
  await initializeWordTranslations()
  
  console.log('Multilingual system initialized')
  console.log('Current language:', i18nService.getCurrentLanguage())
  console.log('Available languages:', i18nService.getAvailableLanguages())
}

/**
 * Example: Get a localized word by ID
 */
export function demonstrateLocalizedWord() {
  const wordId = 'word_001' // 'aberration' in English
  
  // Get the word in the current language
  const localizedWord = getLocalizedWordById(wordId)
  
  if (localizedWord) {
    console.log('Word ID:', localizedWord.id)
    console.log('Localized word:', localizedWord.localizedWord)
    console.log('Localized definition:', localizedWord.localizedDefinition)
    console.log('Original word:', localizedWord.translations.en)
    console.log('Original definition:', localizedWord.definitions.en)
  }
}

/**
 * Example: React component using the useTranslate hook
 */
export function MultilingualGameComponent() {
  const { t, currentLanguage, setLanguage, availableLanguages } = useTranslate()
  
  // Example of translating UI text
  const startButtonText = t('ui.start')
  const gameTitle = t('game.multipleChoice.title')
  const scoreLabel = t('ui.score')
  
  // Example of translating with parameters
  const roundText = t('ui.round', { round: 1 })
  
  const handleLanguageChange = async (language: string) => {
    await setLanguage(language as any)
  }
  
  return {
    startButtonText,
    gameTitle,
    scoreLabel,
    roundText,
    currentLanguage,
    availableLanguages,
    handleLanguageChange,
  }
}

/**
 * Example: Language switching workflow
 */
export async function demonstrateLanguageSwitching() {
  const languages = ['en', 'nl', 'fr', 'de'] as const
  
  for (const lang of languages) {
    console.log(`\n--- Switching to ${lang} ---`)
    
    // Switch language
    await i18nService.setLanguage(lang)
    
    // Get the same word in different languages
    const word = getLocalizedWordById('word_001')
    
    if (word) {
      console.log(`${lang.toUpperCase()}:`, word.localizedWord)
      console.log(`Definition:`, word.localizedDefinition)
    }
    
    // Get UI translations
    console.log('Start button:', i18nService.t('ui.start'))
    console.log('Game title:', i18nService.t('game.multipleChoice.title'))
  }
}

/**
 * Example: Checking translation availability
 */
export function checkTranslationCoverage() {
  // Check available translation languages for a specific word
  // This would require extending the i18n service to check word translations
  console.log('Translation coverage for word_001:')
  console.log('- English: ✅')
  console.log('- Dutch: ✅')
  console.log('- French: ✅')
  console.log('- German: ✅')
  console.log('- Bulgarian: ⏳ (coming soon)')
  console.log('- Indonesian: ⏳ (coming soon)')
}

/**
 * Example: Firebase integration with multilingual support
 */
export function demonstrateFirebaseIntegration() {
  // This shows how user profiles could store language preferences
  const userProfile = {
    id: 'user_123',
    displayName: 'Jean Dupont',
    preferredLanguage: 'fr',
    totalScore: 1250,
    matchesPlayed: 15,
  }
  
  // The app would initialize i18n with the user's preferred language
  console.log(`User ${userProfile.displayName} prefers ${userProfile.preferredLanguage}`)
  
  // Game events would be language-agnostic
  const gameEvent = {
    type: 'answer/submitted' as const,
    wordId: 'word_001',
    selectedDefinition: 'aberration', // This would be the definition ID
    timestamp: Date.now(),
  }
  
  console.log('Game event (language-agnostic):', gameEvent)
}

/**
 * Example: Accessibility integration
 */
export function demonstrateAccessibilityIntegration() {
  // Note: In a real React component, you would use the useTranslate hook
  // For this example, we'll use the i18n service directly
  const announcements = {
    gameStarted: i18nService.t('accessibility.gameStarted'),
    gamePaused: i18nService.t('accessibility.gamePaused'),
    correctAnswer: i18nService.t('game.multipleChoice.correct'),
    incorrectAnswer: i18nService.t('game.multipleChoice.incorrect'),
  }
  
  console.log('Accessibility announcements:')
  Object.entries(announcements).forEach(([key, text]) => {
    console.log(`- ${key}: ${text}`)
  })
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Lexicon Master Multilingual Integration Examples ===\n')
  
  try {
    await initializeMultilingualSystem()
    demonstrateLocalizedWord()
    await demonstrateLanguageSwitching()
    checkTranslationCoverage()
    demonstrateFirebaseIntegration()
    demonstrateAccessibilityIntegration()
    
    console.log('\n=== All examples completed successfully! ===')
  } catch (error) {
    console.error('Example execution failed:', error)
  }
}
