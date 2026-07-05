import type { I18nService, I18nConfig, SupportedLanguage, LocaleData, TranslationPath } from './types'

/**
 * Default i18n configuration
 */
const defaultConfig: I18nConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en'
}

/**
 * In-memory cache for loaded locales
 */
const localeCache = new Map<SupportedLanguage, LocaleData>()

/**
 * Current language state
 */
let currentLanguage: SupportedLanguage = defaultConfig.defaultLanguage

/**
 * Load locale data from JSON files
 */
async function loadLocaleData(language: SupportedLanguage): Promise<LocaleData> {
  // Check cache first
  if (localeCache.has(language)) {
    return localeCache.get(language)!
  }

  try {
    // Dynamic import of locale JSON files
    const localeModule = await import(`./locales/${language}.json`)
    const localeData = localeModule.default as LocaleData
    
    // Cache the loaded data
    localeCache.set(language, localeData)
    return localeData
  } catch (error) {
    console.error(`Failed to load locale data for language: ${language}`, error)
    
    // Fallback to default language if available
    if (language !== defaultConfig.fallbackLanguage) {
      console.warn(`Falling back to ${defaultConfig.fallbackLanguage}`)
      return loadLocaleData(defaultConfig.fallbackLanguage)
    }
    
    throw new Error(`Failed to load locale data for ${language} and fallback ${defaultConfig.fallbackLanguage}`)
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: LocaleData, path: string): string | undefined {
  return path.split('.').reduce((current: any, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key]
    }
    return undefined
  }, obj)
}

/**
 * Replace parameters in translation string
 */
function interpolateParams(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Implementation of I18nService
 */
class I18nServiceImpl implements I18nService {
  private config: I18nConfig
  private currentLocaleData: LocaleData = {}

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  getCurrentLanguage(): SupportedLanguage {
    return currentLanguage
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    try {
      // Load the new locale data
      this.currentLocaleData = await loadLocaleData(language)
      currentLanguage = language
      
      // Store preference in localStorage for persistence
      localStorage.setItem('lexicon-master-language', language)
      
      console.log(`Language set to: ${language}`)
    } catch (error) {
      console.error(`Failed to set language to ${language}:`, error)
      throw error
    }
  }

  getAvailableLanguages(): SupportedLanguage[] {
    return ['en', 'nl', 'bg', 'in', 'fr', 'de']
  }

  t(key: TranslationPath, params?: Record<string, string | number>): string {
    // Try to get translation from current language
    let translation = getNestedValue(this.currentLocaleData, key)
    
    // If not found and not using fallback language, try fallback
    if (!translation && currentLanguage !== this.config.fallbackLanguage) {
      const fallbackData = localeCache.get(this.config.fallbackLanguage)
      if (fallbackData) {
        translation = getNestedValue(fallbackData, key)
      }
    }
    
    // Return translation or key as last resort
    const result = translation || key
    
    // Interpolate parameters if provided
    return interpolateParams(result, params)
  }

  exists(key: TranslationPath): boolean {
    const translation = getNestedValue(this.currentLocaleData, key)
    return translation !== undefined
  }

  getLanguageDisplayName(language: SupportedLanguage): string {
    const displayNames: Record<SupportedLanguage, string> = {
      en: 'English',
      nl: 'Nederlands',
      bg: 'Български',
      in: 'Bahasa Indonesia',
      fr: 'Français',
      de: 'Deutsch'
    }
    return displayNames[language] || language
  }

  /**
   * Initialize the i18n service with saved language preference
   */
  async initialize(): Promise<void> {
    try {
      // Try to get saved language from localStorage
      const savedLanguage = localStorage.getItem('lexicon-master-language') as SupportedLanguage
      
      // Use saved language if valid, otherwise use default
      const initialLanguage = this.getAvailableLanguages().includes(savedLanguage) 
        ? savedLanguage 
        : this.config.defaultLanguage
      
      await this.setLanguage(initialLanguage)
    } catch (error) {
      console.error('Failed to initialize i18n service:', error)
      // Fallback to default language
      await this.setLanguage(this.config.defaultLanguage)
    }
  }
}

/**
 * Create and export i18n service instance
 */
export const i18nService = new I18nServiceImpl()

/**
 * Export service type for dependency injection
 */
export type { I18nService as II18nService }

/**
 * Convenience function for direct translation access
 */
export const t = (key: TranslationPath, params?: Record<string, string | number>): string => {
  return i18nService.t(key, params)
}

/**
 * Initialize i18n service (call this once at app startup)
 */
export const initializeI18n = (): Promise<void> => {
  return i18nService.initialize()
}
