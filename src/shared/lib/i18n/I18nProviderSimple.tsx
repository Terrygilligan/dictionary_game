import { createContext, useContext, useState, type ReactNode } from 'react'
import type { SupportedLanguage } from './types'

interface I18nContextValue {
  currentLanguage: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
  availableLanguages: SupportedLanguage[]
  getLanguageDisplayName: (language: SupportedLanguage) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

// Simple fallback translations for development
const fallbackTranslations: Record<string, Record<string, string>> = {
  en: {
    'landing.tagline': 'A multilingual dictionary game for your village community',
    'landing.welcome': 'Welcome to Lexicon Master',
    'landing.getStarted': 'Get Started',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.displayName': 'Display Name',
    'auth.acceptTerms': 'I accept the',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.termsOfService': 'Terms of Service',
    'auth.and': 'and',
    'auth.mustAcceptTerms': 'You must accept the Terms of Service and Privacy Policy to continue.',
    'profile.title': 'Player Profile',
    'profile.totalScore': 'Total Score',
    'profile.matchesPlayed': 'Matches Played',
    'profile.manageProfile': 'Manage your profile and settings',
    'settings.language': 'Language',
  },
  nl: {
    'landing.tagline': 'Een meertalig woordenspel voor uw dorpsgemeenschap',
    'landing.welcome': 'Welkom bij Lexicon Master',
    'landing.getStarted': 'Beginnen',
    'auth.signIn': 'Inloggen',
    'auth.signUp': 'Aanmelden',
    'auth.email': 'E-mail',
    'auth.password': 'Wachtwoord',
    'auth.displayName': 'Weergavenaam',
    'auth.acceptTerms': 'Ik ga akkoord met de',
    'auth.privacyPolicy': 'Privacybeleid',
    'auth.termsOfService': 'Gebruiksvoorwaarden',
    'auth.and': 'en',
    'auth.mustAcceptTerms': 'U moet de Gebruiksvoorwaarden en het Privacybeleid accepteren om door te gaan.',
    'profile.title': 'Spelersprofiel',
    'profile.totalScore': 'Totaalscore',
    'profile.matchesPlayed': 'Gespeelde wedstrijden',
    'profile.manageProfile': 'Beheer uw profiel en instellingen',
    'settings.language': 'Taal',
  },
  bg: {
    'landing.tagline': 'Многоезиков игра с думи за вашата селска общност',
    'landing.welcome': 'Добре дошли в Lexicon Master',
    'landing.getStarted': 'Започнете',
    'auth.signIn': 'Вход',
    'auth.signUp': 'Регистрация',
    'auth.email': 'Имейл',
    'auth.password': 'Парола',
    'auth.displayName': 'Име за показване',
    'auth.acceptTerms': 'Приемам',
    'auth.privacyPolicy': 'Политика за поверителност',
    'auth.termsOfService': 'Общи условия',
    'auth.and': 'и',
    'auth.mustAcceptTerms': 'Трябва да приемете Общите условия и Политиката за поверителност, за да продължите.',
    'profile.title': 'Профил на играча',
    'profile.totalScore': 'Общ резултат',
    'profile.matchesPlayed': 'Изиграни мачове',
    'profile.manageProfile': 'Управление на профила и настройките',
    'settings.language': 'Език',
  },
  in: {
    'landing.tagline': 'Permainan kamus multibahasa untuk komunitas desamu',
    'landing.welcome': 'Selamat datang di Lexicon Master',
    'landing.getStarted': 'Mulai',
    'auth.signIn': 'Masuk',
    'auth.signUp': 'Daftar',
    'auth.email': 'Email',
    'auth.password': 'Kata Sandi',
    'auth.displayName': 'Nama Tampilan',
    'auth.acceptTerms': 'Saya menerima',
    'auth.privacyPolicy': 'Kebijakan Privasi',
    'auth.termsOfService': 'Syarat dan Ketentuan',
    'auth.and': 'dan',
    'auth.mustAcceptTerms': 'Anda harus menerima Syarat dan Ketentuan serta Kebijakan Privasi untuk melanjutkan.',
    'profile.title': 'Profil Pemain',
    'profile.totalScore': 'Skor Total',
    'profile.matchesPlayed': 'Pertandingan Dimainkan',
    'profile.manageProfile': 'Kelola profil dan pengaturan Anda',
    'settings.language': 'Bahasa',
  },
  fr: {
    'landing.tagline': 'Un jeu de dictionnaire multilingue pour votre communauté villageoise',
    'landing.welcome': 'Bienvenue dans Lexicon Master',
    'landing.getStarted': 'Commencer',
    'auth.signIn': 'Se connecter',
    'auth.signUp': 'S\'inscrire',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.displayName': 'Nom d\'affichage',
    'auth.acceptTerms': 'J\'accepte les',
    'auth.privacyPolicy': 'Politique de confidentialité',
    'auth.termsOfService': 'Conditions d\'utilisation',
    'auth.and': 'et',
    'auth.mustAcceptTerms': 'Vous devez accepter les Conditions d\'utilisation et la Politique de confidentialité pour continuer.',
    'profile.title': 'Profil du joueur',
    'profile.totalScore': 'Score total',
    'profile.matchesPlayed': 'Matchs joués',
    'profile.manageProfile': 'Gérez votre profil et vos paramètres',
    'settings.language': 'Langue',
  },
  de: {
    'landing.tagline': 'Ein mehrsprachiges Wörterbuchspiel für Ihre Dorfgemeinschaft',
    'landing.welcome': 'Willkommen bei Lexicon Master',
    'landing.getStarted': 'Starten',
    'auth.signIn': 'Anmelden',
    'auth.signUp': 'Registrieren',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.displayName': 'Anzeigename',
    'auth.acceptTerms': 'Ich akzeptiere die',
    'auth.privacyPolicy': 'Datenschutzerklärung',
    'auth.termsOfService': 'Nutzungsbedingungen',
    'auth.and': 'und',
    'auth.mustAcceptTerms': 'Sie müssen die Nutzungsbedingungen und die Datenschutzerklärung akzeptieren, um fortzufahren.',
    'profile.title': 'Spielerprofil',
    'profile.totalScore': 'Gesamtpunktzahl',
    'profile.matchesPlayed': 'Gespielte Spiele',
    'profile.manageProfile': 'Verwalten Sie Ihr Profil und Ihre Einstellungen',
    'settings.language': 'Sprache',
  },
}

const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  nl: 'Nederlands',
  bg: 'Български',
  in: 'Bahasa Indonesia',
  fr: 'Français',
  de: 'Deutsch',
}

export function I18nProviderSimple({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en')

  const setLanguage = async (language: SupportedLanguage) => {
    try {
      setCurrentLanguage(language)
      localStorage.setItem('lexicon-master-language', language)
    } catch (error) {
      console.error('Failed to set language:', error)
      throw error
    }
  }

  const t = (key: string, params?: Record<string, string | number>) => {
    const translations = fallbackTranslations[currentLanguage] || fallbackTranslations.en
    let text = translations?.[key] || key
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value))
      })
    }
    
    return text
  }

  const availableLanguages: SupportedLanguage[] = ['en', 'nl', 'bg', 'in', 'fr', 'de']
  
  const getLanguageDisplayName = (language: SupportedLanguage) => {
    return languageNames[language] || language
  }

  const value: I18nContextValue = {
    currentLanguage,
    setLanguage,
    t,
    availableLanguages,
    getLanguageDisplayName,
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
