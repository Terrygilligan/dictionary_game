import { useState, useEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { useNavigation, type Page } from '@/shared/lib/navigation'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

interface HeaderProps {
  isAuthenticated: boolean
}


export function Header({ isAuthenticated }: HeaderProps) {
  const { navigate, currentPage } = useNavigation()
  const { t } = useTranslate()
  const [isAdmin, setIsAdmin] = useState(false)

  // Debug: Track Header renders and state to identify duplication
  useEffect(() => {
    console.log(`🎯 [HEADER] RENDER DETECTED: currentPage=${currentPage}, isAuthenticated=${isAuthenticated}`)
  }, [currentPage, isAuthenticated])
  
  console.log(`🎯 [HEADER] Component rendering: currentPage=${currentPage}`)

  // Check admin status for authenticated users
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const auth = getAuth()
        const user = auth.currentUser
        
        if (user) {
          const idTokenResult = await user.getIdTokenResult()
          const adminClaim = idTokenResult.claims.admin
          setIsAdmin(!!adminClaim)
        }
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      }
    }

    if (isAuthenticated) {
      checkAdminStatus()
    }
  }, [isAuthenticated])

  // Navigation configuration with authentication-based filtering
  const getNavigationItems = () => {
    const allItems = [
      { key: 'landing' as Page, translationKey: 'ui.home', show: true, authRequired: false },
      { key: 'game' as Page, translationKey: 'ui.gamesRoom', show: true, authRequired: false },
      { key: 'village' as Page, translationKey: 'ui.village', show: isAuthenticated, authRequired: true },
      { key: 'profile' as Page, translationKey: 'ui.profile', show: isAuthenticated, authRequired: true },
      { key: 'auth' as Page, translationKey: 'ui.signIn', show: !isAuthenticated, authRequired: false },
      { key: 'admin' as Page, translationKey: 'ui.admin', show: isAuthenticated && isAdmin, authRequired: true, isAdminOnly: true },
    ]

    return allItems.filter(item => item.show)
  }

  return (
    <header className="header" data-active-page={currentPage}>
      <div className="header__container">
        <div className="header__content">
          <div className="header__brand">
            <h1 className="header__title">Lexicon Master</h1>
            <span className="header__tagline">{t('ui.tagline')}</span>
          </div>
          
          {/* Unified Navigation - Single Source of Truth */}
          <nav className="header__nav">
            {getNavigationItems().map((item) => {
              const baseClasses = 'header__nav-link'
              const primaryClass = item.key === 'village' ? 'header__nav-link--primary' : ''
              const adminClass = item.isAdminOnly ? 'header__nav-link--admin' : ''
              const activeClass = currentPage === item.key ? 'header__nav-link--active' : ''
              const className = `${baseClasses} ${primaryClass} ${adminClass} ${activeClass}`.trim()
              
              return (
                <Button
                  key={item.key}
                  variant="ghost"
                  onClick={() => navigate(item.key)}
                  className={className}
                  data-nav-page={item.key}
                >
                  {t(item.translationKey)}
                </Button>
              )
            })}
          </nav>
          
          <div className="header__actions">
            <LanguageSwitcher className="header__language-switcher" />
          </div>
        </div>
      </div>
    </header>
  )
}
