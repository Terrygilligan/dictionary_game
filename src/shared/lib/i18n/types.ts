export type SupportedLanguage = 'en' | 'nl' | 'bg' | 'in' | 'fr' | 'de'

export interface I18nConfig {
  defaultLanguage: SupportedLanguage
  fallbackLanguage: SupportedLanguage
}

export interface LocaleData {
  [key: string]: string | LocaleData
}

export type TranslationPath = string

export interface I18nService {
  /**
   * Get the current language
   */
  getCurrentLanguage(): SupportedLanguage
  
  /**
   * Set the current language
   */
  setLanguage(language: SupportedLanguage): Promise<void>
  
  /**
   * Get available languages
   */
  getAvailableLanguages(): SupportedLanguage[]
  
  /**
   * Translate a key path to the current language
   */
  t(key: TranslationPath, params?: Record<string, string | number>): string
  
  /**
   * Check if a translation exists for a key
   */
  exists(key: TranslationPath): boolean
  
  /**
   * Get the display name of a language
   */
  getLanguageDisplayName(language: SupportedLanguage): string
}
