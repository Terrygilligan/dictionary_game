import { useNavigation } from '@/shared/lib/navigation'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

interface HeaderProps {
  isAuthenticated?: boolean
}

export function Header({ isAuthenticated = false }: HeaderProps) {
  const { navigate, currentPage } = useNavigation()
  const { t } = useTranslate()

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__content">
          <div className="header__brand">
            <h1 className="header__title">Lexicon Master</h1>
            <span className="header__tagline">{t('ui.tagline')}</span>
          </div>
          
          {isAuthenticated && (
            <nav className="header__nav">
              <Button 
                variant="ghost" 
                onClick={() => navigate('landing')}
                className={`header__nav-link ${currentPage === 'landing' ? 'header__nav-link--active' : ''}`}
              >
                {t('ui.home')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('games')}
                className={`header__nav-link ${currentPage === 'games' ? 'header__nav-link--active' : ''}`}
              >
                {t('ui.gamesRoom')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('village')}
                className={`header__nav-link header__nav-link--primary ${currentPage === 'village' ? 'header__nav-link--active' : ''}`}
              >
                {t('ui.village')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('profile')}
                className={`header__nav-link ${currentPage === 'profile' ? 'header__nav-link--active' : ''}`}
              >
                {t('ui.profile')}
              </Button>
            </nav>
          )}
          
          <div className="header__actions">
            <LanguageSwitcher className="header__language-switcher" />
          </div>
        </div>
      </div>
    </header>
  )
}
