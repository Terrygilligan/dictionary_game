import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { initializeI18n, i18nService } from './i18nService'
import type { SupportedLanguage } from './types'

interface I18nContextValue {
  currentLanguage: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  availableLanguages: SupportedLanguage[]
  getLanguageDisplayName: (language: SupportedLanguage) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en')
  const [isInitialized, setIsInitialized] = useState(false)
  const isInitializingRef = useRef(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Prevent race conditions by ensuring single initialization
        if (isInitializingRef.current) return
        
        isInitializingRef.current = true
        console.log('🌐 [I18N] Initializing with single source of truth')
        await initializeI18n()
        const language = i18nService.getCurrentLanguage()
        console.log('🌐 [I18N] Set language to:', language)
        setCurrentLanguage(language)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize i18n:', error)
        // Fallback to default language
        setCurrentLanguage('en')
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized])

  const setLanguage = async (language: SupportedLanguage) => {
    try {
      await i18nService.setLanguage(language)
      setCurrentLanguage(language)
    } catch (error) {
      console.error('Failed to set language:', error)
      throw error
    }
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    return i18nService.t(key, params)
  }

  const availableLanguages = i18nService.getAvailableLanguages()
  const getLanguageDisplayName = (language: SupportedLanguage) => {
    return i18nService.getLanguageDisplayName(language)
  }

  const value: I18nContextValue = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages,
    getLanguageDisplayName,
  }

  if (!isInitialized) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
