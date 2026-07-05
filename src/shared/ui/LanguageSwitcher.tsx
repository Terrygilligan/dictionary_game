import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import type { SupportedLanguage } from '@/shared/lib/i18n/types'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useTranslate()

  const handleLanguageChange = async (language: SupportedLanguage) => {
    await setLanguage(language)
  }

  return (
    <div className={`language-switcher ${className}`}>
      <label htmlFor="language-select" className="language-switcher__label">
        Language:
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        className="language-switcher__select"
      >
        {availableLanguages.map((language: SupportedLanguage) => (
          <option key={language} value={language}>
            {getLanguageDisplayName(language)}
          </option>
        ))}
      </select>
    </div>
  )
}
