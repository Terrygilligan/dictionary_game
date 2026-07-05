import { useCallback } from 'react'
import type { SupportedLanguage, TranslationPath } from './types'
import { useI18n } from './I18nProvider'

/**
 * React hook for internationalization
 * Provides translation function and language state management
 */
export interface UseTranslateReturn {
  /**
   * Translation function
   */
  t: (key: TranslationPath, params?: Record<string, string | number>) => string
  
  /**
   * Current language
   */
  currentLanguage: SupportedLanguage
  
  /**
   * Change current language
   */
  setLanguage: (language: SupportedLanguage) => Promise<void>
  
  /**
   * Available languages
   */
  availableLanguages: SupportedLanguage[]
  
  /**
   * Get display name for a language
   */
  getLanguageDisplayName: (language: SupportedLanguage) => string
  
  /**
   * Check if translation exists
   */
  exists: (key: TranslationPath) => boolean
}

/**
 * Hook for using i18n in React components
 */
export function useTranslate(): UseTranslateReturn {
  const { currentLanguage, setLanguage, t, availableLanguages, getLanguageDisplayName } = useI18n()

  // Check if translation exists
  const exists = useCallback(
    (key: TranslationPath) => {
      // Simple implementation - in a real app this would be more sophisticated
      return t(key) !== key
    },
    [t]
  )

  return {
    t,
    currentLanguage,
    setLanguage,
    availableLanguages,
    getLanguageDisplayName,
    exists,
  }
}

/**
 * Hook for language selector component
 * Returns language options with display names
 */
export function useLanguageOptions() {
  const { currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useTranslate()

  const languageOptions = availableLanguages.map(language => ({
    value: language,
    label: getLanguageDisplayName(language),
    isSelected: language === currentLanguage,
  }))

  const changeLanguage = async (language: SupportedLanguage) => {
    await setLanguage(language)
  }

  return {
    currentLanguage,
    languageOptions,
    changeLanguage,
  }
}
