import { useState, useEffect } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { BackendTester } from '@/components/BackendTester'
import { authService } from '@/services/auth'
import { dbService } from '@/services/db'
import type { User } from '@/entities/user'

interface ProfilePageProps {
  user: User
  onSignOut: () => void
}

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const { t, currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useTranslate()
  const [userStats, setUserStats] = useState({
    totalScore: 0,
    matchesPlayed: 0,
    winRate: 0,
    highestStreak: 0,
    currentStreak: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load user statistics from event logs
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setIsLoading(true)
        const eventLogs = await dbService.getUserEventLogs(user.id)
        
        // Calculate stats from event logs
        let totalScore = 0
        let matchesPlayed = eventLogs.length
        let wins = 0
        let highestStreak = 0
        let currentStreak = 0

        eventLogs.forEach(log => {
          log.events.forEach(envelope => {
            const event = envelope.event
            if (event && typeof event === 'object') {
              const typedEvent = event as any
              if (typedEvent.type === 'profile/updated' && typedEvent.totalScore) {
                totalScore = Math.max(totalScore, typedEvent.totalScore)
              }
              if (typedEvent.type === 'streak/updated') {
                highestStreak = Math.max(highestStreak, typedEvent.streak)
                currentStreak = typedEvent.streak
              }
              if (typedEvent.type === 'game/finished') {
                // This would need more complex logic to determine wins
                wins++
              }
            }
          })
        })

        const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0

        setUserStats({
          totalScore,
          matchesPlayed,
          winRate,
          highestStreak,
          currentStreak,
        })
      } catch (error) {
        console.error('Failed to load user stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserStats()
  }, [user.id])

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
            <p className="profile__stat-value">{userStats.totalScore.toLocaleString()}</p>
            <p className="profile__stat-label">{t('profile.totalScore')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.matchesPlayed}</p>
            <p className="profile__stat-label">{t('profile.matchesPlayed')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats.winRate.toFixed(1)}%</p>
            <p className="profile__stat-label">{t('profile.winRate')}</p>
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
          {userStats.matchesPlayed > 0 
            ? t('profile.activityDescription', { count: userStats.matchesPlayed })
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
