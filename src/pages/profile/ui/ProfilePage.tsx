import { useState, useEffect } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { BackendTester } from '@/components/BackendTester'
import { authService } from '@/services/auth'
import { userService } from '@/services/userService'
import type { User, UserStats } from '@/entities/user'

interface ProfilePageProps {
  user: User
  onSignOut: () => void
}

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const { t, currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useTranslate()
  const [userStats, setUserStats] = useState<UserStats>({
    gamesPlayed: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    streak: 0,
    highestStreak: 0,
    updatedAt: Date.now(),
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load user statistics from Firestore
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        const stats = await userService.loadUserStats(user.id)
        
        if (stats) {
          setUserStats(stats)
        }
      } catch (error) {
        console.error('Failed to load user stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserStats()
  }, [user])

  // Calculate accuracy percentage
  const accuracy = userService.calculateAccuracy(userStats)

  const handleLanguageChange = async (language: string) => {
    try {
      await setLanguage(language as any)
    } catch (error) {
      console.error('Failed to change language:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      onSignOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>{t('ui.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__masthead">
        <div className="page__header">
          <h1 className="page__title">{t('profile.title')}</h1>
          <LanguageSwitcher className="page__language-switcher" />
        </div>
        <p className="page__tagline">{t('profile.manageProfile')}</p>
      </div>

      <div className="panel">
        <div className="profile__header">
          <div className="profile__avatar">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <h2 className="profile__name">{user.displayName}</h2>
          <p className="profile__email">{user.email}</p>
        </div>

        <div className="profile__stats">
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.gamesPlayed}</p>
            <p className="profile__stat-label">{t('profile.gamesPlayed')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.correctAnswers}</p>
            <p className="profile__stat-label">{t('profile.correctAnswers')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.totalQuestions}</p>
            <p className="profile__stat-label">{t('profile.totalQuestions')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{accuracy.toFixed(1)}%</p>
            <p className="profile__stat-label">{t('profile.accuracy')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.highestStreak}</p>
            <p className="profile__stat-label">{t('profile.highestStreak')}</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="profile__section-title">{t('settings.language')}</h3>
        <div className="language__options">
          {availableLanguages.map(language => (
            <div
              key={language}
              className={`language__option ${currentLanguage === language ? 'selected' : ''}`}
              onClick={() => handleLanguageChange(language)}
            >
              <div className="language__flag" />
              <div className="language__info">
                <div className="language__name">{getLanguageDisplayName(language)}</div>
                <div className="language__native">{language}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3 className="profile__section-title">{t('profile.recentActivity')}</h3>
        <p className="panel__lead">
          {userStats.gamesPlayed > 0 
            ? t('profile.activityDescription', { count: userStats.gamesPlayed })
            : t('profile.noActivity')
          }
        </p>
      </div>

      <div className="panel panel--center">
        <Button variant="ghost" onClick={handleSignOut}>
          {t('auth.signOut')}
        </Button>
      </div>

      <BackendTester />
    </div>
  )
}
