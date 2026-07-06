import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { useNavigation } from '@/shared/lib/navigation'

export function LandingPage() {
  const { t } = useTranslate()
  const { navigate } = useNavigation()

  // Helper function to safely get translations with fallbacks
  const safeT = (key: string, fallback?: string) => {
    const translation = t(key)
    // If translation equals the key (not found) and we have a fallback, use fallback
    if (translation === key && fallback) {
      return fallback
    }
    return translation
  }

  const handlePlayAsGuest = () => {
    navigate('game')
  }

  const handleRegister = () => {
    navigate('auth')
  }

  return (
    <div className="page">
      {/* Hero Section with Guest Entry Point */}
      <div className="panel panel--center panel--hero">
        <h2 className="panel__title">{safeT('landing.welcome', 'Welcome to Lexicon Master')}</h2>
        <p className="panel__lead">{safeT('landing.description', 'Challenge yourself with words in multiple languages while connecting with your community.')}</p>
        <p className="panel__tagline">{safeT('landing.tagline', 'A multilingual dictionary game for your village community')}</p>
        
        {/* High-visibility Guest Button */}
        <div className="landing__guest-cta">
          <Button 
            variant="primary" 
            onClick={handlePlayAsGuest}
            className="landing__guest-button"
          >
            {safeT('landing.playAsGuest', 'Play as Guest')}
          </Button>
          
          {/* Registration Hook */}
          <div className="landing__register-hook">
            <p className="landing__register-text">
              {safeT('landing.registerHook', 'Want to save your stats? Register an account.')}
            </p>
            <Button 
              variant="ghost" 
              onClick={handleRegister}
              className="landing__register-button"
            >
              {safeT('landing.registerAccount', 'Register an account')}
            </Button>
          </div>
          
          {/* Privacy/GDPR Notice */}
          <div className="landing__privacy-notice">
            <p className="landing__privacy-text">
              {safeT('landing.guestPrivacyNotice', 'Guest sessions are temporary and will be deleted when you close your browser. No personal data is stored.')}
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="panel panel--center">
        <h2 className="panel__title">{safeT('landing.features.title', 'Features')}</h2>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{safeT('landing.features.multilingual.title', 'Multilingual Support')}</h3>
            <p>{safeT('landing.features.multilingual.description', 'Play in English, Dutch, Bulgarian, Indonesian, French, and German')}</p>
          </div>
          <div className="landing__feature">
            <h3>{safeT('landing.features.accessible.title', 'Fully Accessible')}</h3>
            <p>{safeT('landing.features.accessible.description', 'Text-to-speech, speech-to-text, and keyboard navigation for everyone')}</p>
          </div>
          <div className="landing__feature">
            <h3>{safeT('landing.features.village.title', 'Community Built')}</h3>
            <p>{safeT('landing.features.village.description', 'Contributed by villagers, for villagers - building connections through language')}</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="panel">
        <h2 className="panel__title">{safeT('landing.howItWorks.title', 'How It Works')}</h2>
        <ol className="landing__steps">
          <li>{safeT('landing.howItWorks.step1', 'Sign in with your email or create a new account')}</li>
          <li>{safeT('landing.howItWorks.step2', 'Choose your preferred language')}</li>
          <li>{safeT('landing.howItWorks.step3', 'Play dictionary games or challenge the Dealer')}</li>
          <li>{safeT('landing.howItWorks.step4', 'Track your progress and compete with friends')}</li>
        </ol>
      </div>
    </div>
  )
}
