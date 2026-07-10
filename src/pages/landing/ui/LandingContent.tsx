import { Button } from '@/shared/ui/Button'
import { JumpToMenu } from './JumpToMenu'

interface LandingContentProps {
  safeT: (key: string, fallback?: string) => string
  handlePlayAsGuest: () => void
  handleRegister: () => void
}

export function LandingContent({ safeT, handlePlayAsGuest, handleRegister }: LandingContentProps) {
  return (
    <div className="page">
      {/* Hero Section */}
      <div className="panel panel--center panel--hero">
        <h2 className="panel__title">{safeT('landing.welcome', 'Welcome to Lexicon Master')}</h2>
        <p className="panel__lead">{safeT('landing.description', 'Challenge yourself with words in multiple languages while connecting with your community.')}</p>
        <p className="panel__tagline">{safeT('landing.tagline', 'A multilingual dictionary game for your village community')}</p>
      </div>

      {/* Jump-to Menu */}
      <JumpToMenu safeT={safeT} />

      {/* Features Section */}
      <div id="features" className="panel panel--center">
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

      {/* Data Ownership: Your Data, Your Control */}
      <div id="privacy" className="panel panel--center">
        <h2 className="panel__title">{safeT('landing.dataControl.title', 'Your Data, Your Control')}</h2>
        <p className="panel__lead">{safeT('landing.dataControl.description', 'We believe in data privacy and transparency. Your information belongs to you.')}</p>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{safeT('landing.dataControl.euCompliance.title', 'EU Compliant')}</h3>
            <p>{safeT('landing.dataControl.euCompliance.description', 'Fully compliant with GDPR and EU data protection regulations. Your data is processed securely and transparently.')}</p>
          </div>
          <div className="landing__feature">
            <h3>{safeT('landing.dataControl.oneClickDeletion.title', 'One-Click Deletion')}</h3>
            <p>{safeT('landing.dataControl.oneClickDeletion.description', 'Delete your account and all associated data instantly with a single button click. No questions asked.')}</p>
          </div>
          <div className="landing__feature">
            <h3>{safeT('landing.dataControl.noTracking.title', 'No Third-Party Tracking')}</h3>
            <p>{safeT('landing.dataControl.noTracking.description', 'We never sell your data or use third-party analytics. Your activity stays within our community.')}</p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="panel">
        <h2 className="panel__title">{safeT('landing.howItWorks.title', 'How It Works')}</h2>
        <ol className="landing__steps">
          <li>{safeT('landing.howItWorks.step1', 'Sign in with your email or create a new account')}</li>
          <li>{safeT('landing.howItWorks.step2', 'Choose your preferred language')}</li>
          <li>{safeT('landing.howItWorks.step3', 'Play dictionary games or challenge the Dealer')}</li>
          <li>{safeT('landing.howItWorks.step4', 'Track your progress and compete with friends')}</li>
        </ol>
      </div>

      {/* Session Stakes: Play Your Way */}
      <div id="play-your-way" className="panel panel--center">
        <h2 className="panel__title">{safeT('landing.playYourWay.title', 'Play Your Way')}</h2>
        <p className="panel__lead">{safeT('landing.playYourWay.description', 'Choose how you want to experience Lexicon Master')}</p>
        
        <div className="landing__features">
          <div className="landing__feature">
            <h3>{safeT('landing.playYourWay.guest.title', 'Guest Session')}</h3>
            <p>{safeT('landing.playYourWay.guest.description', 'Jump in immediately and play. Your stats are temporary and cleared when you close your browser.')}</p>
            <div className="landing__guest-cta">
              <Button 
                variant="primary" 
                onClick={handlePlayAsGuest}
                className="landing__guest-button"
              >
                {safeT('landing.playAsGuest', 'Play as Guest')}
              </Button>
            </div>
          </div>
          <div className="landing__feature">
            <h3>{safeT('landing.playYourWay.registered.title', 'Registered Member')}</h3>
            <p>{safeT('landing.playYourWay.registered.description', 'Save your progress, track your statistics, and compete with friends over time.')}</p>
            <div className="landing__register-hook">
              <Button 
                variant="ghost" 
                onClick={handleRegister}
                className="landing__register-button"
              >
                {safeT('landing.registerAccount', 'Register an account')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
