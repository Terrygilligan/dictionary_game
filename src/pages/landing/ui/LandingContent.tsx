import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { JumpToMenu } from './JumpToMenu'
import { LiquidGuestButton } from './LiquidGuestButton'

interface LandingContentProps {
  handlePlayAsGuest: () => void
  handleRegister: () => void
}

export function LandingContent({ handlePlayAsGuest, handleRegister }: LandingContentProps) {
  const { t } = useTranslate()

  return (
    <div className="page">
      {/* Hero Section */}
      <div className="panel panel--center panel--hero">
        <h2 className="panel__title">{t('landing.welcome')}</h2>
        <p className="panel__lead">{t('landing.description')}</p>
        <p className="panel__tagline">{t('landing.tagline')}</p>
      </div>

      {/* Jump-to Menu */}
      <JumpToMenu />

      {/* Features Section */}
      <div id="features" className="panel panel--center">
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

      {/* Data Ownership: Your Data, Your Control */}
      <div id="privacy" className="panel panel--center">
        <h2 className="panel__title">{t('landing.dataControl.title')}</h2>
        <p className="panel__lead">{t('landing.dataControl.description')}</p>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{t('landing.dataControl.euCompliance.title')}</h3>
            <p>{t('landing.dataControl.euCompliance.description')}</p>
          </div>
          <div className="landing__feature">
            <h3>{t('landing.dataControl.oneClickDeletion.title')}</h3>
            <p>{t('landing.dataControl.oneClickDeletion.description')}</p>
          </div>
          <div className="landing__feature">
            <h3>{t('landing.dataControl.noTracking.title')}</h3>
            <p>{t('landing.dataControl.noTracking.description')}</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="panel">
        <h2 className="panel__title">{t('landing.howItWorks.title')}</h2>
        <ol className="landing__steps">
          <li>{t('landing.howItWorks.step1')}</li>
          <li>{t('landing.howItWorks.step2')}</li>
          <li>{t('landing.howItWorks.step3')}</li>
          <li>{t('landing.howItWorks.step4')}</li>
        </ol>
      </div>

      {/* Session Stakes: Play Your Way */}
      <div id="play-your-way" className="panel panel--center">
        <h2 className="panel__title">{t('landing.playYourWay.title')}</h2>
        <p className="panel__lead">{t('landing.playYourWay.description')}</p>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{t('landing.playYourWay.guest.title')}</h3>
            <p>{t('landing.playYourWay.guest.description')}</p>
            <div className="landing__guest-cta">
              <LiquidGuestButton 
                onClick={handlePlayAsGuest}
                className="landing__guest-button"
              >
                {t('landing.playAsGuest')}
              </LiquidGuestButton>
              <p className="landing__guest-limit">
                {t('landing.guestLimit')}
              </p>
            </div>
          </div>
          <div className="landing__feature">
            <h3>{t('landing.playYourWay.registered.title')}</h3>
            <p>{t('landing.playYourWay.registered.description')}</p>
            <div className="landing__register-hook">
              <Button 
                variant="ghost" 
                onClick={handleRegister}
                className="landing__register-button"
              >
                {t('landing.registerAccount')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
