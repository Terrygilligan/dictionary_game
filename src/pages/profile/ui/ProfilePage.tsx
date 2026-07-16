import { useState, memo } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { authCommandService } from '@/services/AuthCommandService'
import { useUserStore, useUserStats } from '@/entities/user'
import { useNavigation } from '@/shared/lib/navigation'
import { userService } from '@/services/userService'
import type { User, UpdateProfile } from '@/entities/user'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'

interface ProfilePageProps {
  user: User
}

export function ProfilePage({ user }: ProfilePageProps) {
  // ALL HOOKS MUST BE DECLARED UNCONDITIONALLY AT THE TOP
  const { t, currentLanguage, setLanguage, availableLanguages, getLanguageDisplayName } = useTranslate()
  const { currentPage } = useNavigation()
  const { tenant_id, aggregate_id, isLoading, error } = useGameIdentity()
  const { userStats, statsLoading } = useUserStats()
  const store = useUserStore()
  const [isSaving, setIsSaving] = useState(false)
  const [locationForm, setLocationForm] = useState({
    village: user.village || '',
    postcode: user.postcode || '',
    shareLocationForLeaderboard: user.shareLocationForLeaderboard || false,
  })

  // Handle loading state
  if (isLoading) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Loading identity...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Authentication required: {error}</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      </div>
    )
  }

  // Handle missing identity
  if (!tenant_id || !aggregate_id) {
    return (
      <div className="page">
        <div className="panel panel--center">
          <p>Identity not available</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    )
  }

  // Ghost render detection
  if (currentPage !== 'profile') {
    console.error('👻 [PROFILE] GHOST RENDER DETECTED - currentPage:', currentPage, 'expected: profile')
    return null
  }

  // Debug: Log when ProfilePage renders
  console.log('👤 [PROFILE] ProfilePage rendering for user:', user.displayName)
  console.log('👤 [PROFILE] User email:', user.email)
  console.log('🔐 [PROFILE] Identity context:', { tenant_id, aggregate_id })

  // Calculate accuracy percentage
  const accuracy = userService.calculateAccuracy(userStats || {
    gamesPlayed: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    streak: 0,
    highestStreak: 0,
    updatedAt: Date.now(),
  })

  const handleLanguageChange = async (language: string) => {
    console.log('🌐 [PROFILE] Language change clicked:', language)
    try {
      await setLanguage(language as any)
      console.log('✅ [PROFILE] Language changed to:', language)
    } catch (error) {
      console.error('❌ [PROFILE] Failed to change language:', error)
    }
  }

  const handleSignOut = async () => {
    console.log('🚪 [PROFILE_PAGE] Starting sign-out process')
    try {
      const result = await authCommandService.signOutUser()
      
      if (result.success) {
        console.log('✅ [PROFILE_PAGE] AuthCommandService sign-out successful')
        // Force hard redirect to ensure complete app re-initialization
        window.location.href = '/auth'
      } else {
        console.error('❌ [PROFILE_PAGE] Sign out failed:', result.error)
        // Even if signOut fails, attempt redirect to prevent stuck state
        window.location.href = '/auth'
      }
    } catch (error) {
      console.error('❌ [PROFILE_PAGE] Sign out error:', error)
      // Even if signOut fails, attempt redirect to prevent stuck state
      window.location.href = '/auth'
    }
  }

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSaving(true)
      
      // Strict compliance: Include identity metadata from useGameIdentity
      const updateCommand: UpdateProfile = {
        type: 'profile/update',
        tenant_id,
        aggregate_id,
        village: locationForm.village || undefined,
        postcode: locationForm.postcode || undefined,
        shareLocationForLeaderboard: locationForm.shareLocationForLeaderboard,
      }
      
      console.log('🔐 [PROFILE] Dispatching profile update:', updateCommand)
      store.dispatch(updateCommand, tenant_id, aggregate_id)
      
      console.log('✅ Location settings saved successfully')
    } catch (error) {
      console.error('❌ Failed to save location settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLocationChange = (field: keyof typeof locationForm, value: string | boolean) => {
    setLocationForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle stats loading state (must be after all hooks)
  if (statsLoading) {
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
            <p className="profile__stat-value">{userStats?.gamesPlayed || 0}</p>
            <p className="profile__stat-label">{t('profile.gamesPlayed')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats?.correctAnswers || 0}</p>
            <p className="profile__stat-label">{t('profile.correctAnswers')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats?.totalQuestions || 0}</p>
            <p className="profile__stat-label">{t('profile.totalQuestions')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{accuracy.toFixed(1)}%</p>
            <p className="profile__stat-label">{t('profile.accuracy')}</p>
          </div>
          <div className="profile__stat">
            <p className="profile__stat-value">{userStats?.highestStreak || 0}</p>
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
        <h3 className="profile__section-title">{t('profile.locationSettings')}</h3>
        <form onSubmit={handleLocationSubmit} className="profile__location-form">
          <div className="form-group">
            <label htmlFor="village" className="form-label">
              {t('profile.village')}
            </label>
            <input
              type="text"
              id="village"
              className="form-input"
              value={locationForm.village}
              onChange={(e) => handleLocationChange('village', e.target.value)}
              placeholder={t('profile.villagePlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="postcode" className="form-label">
              {t('profile.postcode')}
            </label>
            <input
              type="text"
              id="postcode"
              className="form-input"
              value={locationForm.postcode}
              onChange={(e) => handleLocationChange('postcode', e.target.value)}
              placeholder={t('profile.postcodePlaceholder')}
            />
          </div>
          
          <div className="form-group">
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={locationForm.shareLocationForLeaderboard}
                onChange={(e) => handleLocationChange('shareLocationForLeaderboard', e.target.checked)}
              />
              <span className="form-checkbox-text">
                {t('profile.shareLocationForLeaderboard')}
              </span>
            </label>
            <p className="form-help">
              {t('profile.shareLocationForLeaderboardHelp')}
            </p>
          </div>
          
          <div className="form-actions">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('ui.saving') : t('ui.save')}
            </Button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3 className="profile__section-title">{t('profile.recentActivity')}</h3>
        <p className="panel__lead">
          {(userStats?.gamesPlayed || 0) > 0 
            ? t('profile.activityDescription', { count: userStats?.gamesPlayed || 0 })
            : t('profile.noActivity')
          }
        </p>
      </div>

      <div className="panel panel--center">
        <Button variant="ghost" onClick={handleSignOut}>
          {t('auth.signOut')}
        </Button>
      </div>

          </div>
  )
}

// Apply memo to prevent double execution from BaseLayout re-renders
export default memo(ProfilePage)
