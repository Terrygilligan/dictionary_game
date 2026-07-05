import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { useNavigation } from '@/shared/lib/navigation'

export function LandingPage() {
  const { t } = useTranslate()
  const { navigate } = useNavigation()

  const handlePlayAsGuest = () => {
    navigate('game')
  }

  const handleRegister = () => {
    navigate('auth')
  }

  return (
    <div className="page">
      {/* Public Header - Branding + Language Switcher Only */}
      <div className="page__masthead page__masthead--public">
        <div className="page__header page__header--public">
          <h1 className="page__title">Lexicon Master</h1>
          <LanguageSwitcher className="page__language-switcher" />
        </div>
        <p className="page__tagline">{t('landing.tagline')}</p>
      </div>

      {/* Hero Section with Guest Entry Point */}
      <div className="panel panel--center panel--hero">
        <h2 className="panel__title">{t('landing.welcome')}</h2>
        <p className="panel__lead">{t('landing.description')}</p>
        
        {/* High-visibility Guest Button */}
        <div className="landing__guest-cta">
          <Button 
            variant="primary" 
            onClick={handlePlayAsGuest}
            className="landing__guest-button"
          >
            {t('landing.playAsGuest')}
          </Button>
          
          {/* Registration Hook */}
          <div className="landing__register-hook">
            <p className="landing__register-text">
              {t('landing.registerHook')}
            </p>
            <Button 
              variant="ghost" 
              onClick={handleRegister}
              className="landing__register-button"
            >
              {t('landing.registerAccount')}
            </Button>
          </div>
          
          {/* Privacy/GDPR Notice */}
          <div className="landing__privacy-notice">
            <p className="landing__privacy-text">
              {t('landing.guestPrivacyNotice')}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="panel panel--center">
        <h2 className="panel__title">{t('landing.features.title')}</h2>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{t('landing.features.multilingual.title')}</h3>
            <p>{t('landing.features.multilingual.description')}</p>
          </div>
          <div className="landing__feature">
            <h3>{t('landing.features.accessible.title')}</h3>
            <p>{t('landing.features.accessible.description')}</p>
          </div>
          <div className="landing__feature">
            <h3>{t('landing.features.village.title')}</h3>
            <p>{t('landing.features.village.description')}</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="panel">
        <h2 className="panel__title">{t('landing.howItWorks.title')}</h2>
        <ol className="landing__steps">
          <li>{t('landing.howItWorks.step1')}</li>
          <li>{t('landing.howItWorks.step2')}</li>
          <li>{t('landing.howItWorks.step3')}</li>
          <li>{t('landing.howItWorks.step4')}</li>
        </ol>
      </div>
    </div>
  )
}
