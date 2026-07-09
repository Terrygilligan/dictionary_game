import { useState, useEffect, useLayoutEffect } from 'react'
import { getAuth } from 'firebase/auth'
import { useNavigation } from '@/shared/lib/navigation'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

interface HeaderProps {
  isAuthenticated?: boolean
}

// Navigation map for cleaner header management
const NAV_MAP = {
  landing: { key: 'landing', translationKey: 'ui.home', isPrimary: false, isAdminOnly: false },
  games: { key: 'games', translationKey: 'ui.gamesRoom', isPrimary: false, isAdminOnly: false },
  village: { key: 'village', translationKey: 'ui.village', isPrimary: true, isAdminOnly: false },
  profile: { key: 'profile', translationKey: 'ui.profile', isPrimary: false, isAdminOnly: false },
  admin: { key: 'admin', translationKey: 'ui.admin', isPrimary: false, isAdminOnly: true }
} as const

export function Header({ isAuthenticated = false }: HeaderProps) {
  const { navigate, currentPage } = useNavigation()
  const { t } = useTranslate()
  const [isAdmin, setIsAdmin] = useState(false)

  // Debug: Track Header's currentPage state
  useEffect(() => {
    console.log(`🎯 [HEADER] currentPage updated: ${currentPage}`)
  }, [currentPage])

  // DOM Override: Force active class management to bypass React batching issues
  useLayoutEffect(() => {
    console.log(`🔧 [HEADER] DOM Override - updating active classes for: ${currentPage}`)
    
    // Clear all active classes first
    const allNavLinks = document.querySelectorAll('.header__nav-link')
    allNavLinks.forEach(link => {
      link.classList.remove('header__nav-link--active')
    })
    
    // Apply active class to current page
    const activeLink = document.querySelector(`[data-nav-page="${currentPage}"]`)
    if (activeLink) {
      activeLink.classList.add('header__nav-link--active')
      console.log(`🔧 [HEADER] Applied active class to: ${currentPage}`)
    }
  }, [currentPage])

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
              {Object.values(NAV_MAP).map((navItem) => {
                // Skip admin-only items if user is not admin
                if (navItem.isAdminOnly && !isAdmin) return null
                
                const isActive = currentPage === navItem.key
                const baseClasses = 'header__nav-link'
                const primaryClass = navItem.isPrimary ? 'header__nav-link--primary' : ''
                const adminClass = navItem.isAdminOnly ? 'header__nav-link--admin' : ''
                const activeClass = isActive ? 'header__nav-link--active' : ''
                const className = `${baseClasses} ${primaryClass} ${adminClass} ${activeClass}`.trim()
                
                return (
                  <Button
                    key={navItem.key}
                    variant="ghost"
                    onClick={() => navigate(navItem.key)}
                    className={className}
                    data-nav-page={navItem.key}
                  >
                    {t(navItem.translationKey)}
                  </Button>
                )
              })}
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
