import { useState, memo } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { useNavigation } from '@/shared/lib/navigation'
import { useVillageState, useVillageStore } from '@/entities/village'
import { useGameIdentity } from '@/features/play-round/model/useFirebaseAuth'
import type { CreateVillageCommand } from '@/entities/village'

export function VillagePage() {
  const { t } = useTranslate()
  const { currentPage } = useNavigation()
  const [activeTab, setActiveTab] = useState<'community' | 'battles'>('community')
  const { villageState, isLoading, error } = useVillageState()
  const villageStore = useVillageStore()
  const { tenant_id, aggregate_id } = useGameIdentity()

  // Ghost render detection - after hooks to respect rules-of-hooks
  if (currentPage !== 'village') {
    console.error('🏘️ [VILLAGE] GHOST RENDER DETECTED - currentPage:', currentPage, 'expected: village')
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="village village--loading">
        <div className="panel">
          <h2>{t('village.loading') || 'Loading Village...'}</h2>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="village village--error">
        <div className="panel">
          <h2>{t('village.error') || 'Error loading village'}</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Use event-sourced state, default to empty village if not initialized
  const currentVillage = villageState?.currentVillage || {
    id: 'village_main',
    name: 'Lexicon Village',
    description: 'A multilingual community building bridges through language',
    createdAt: Date.now(),
    memberCount: 0,
    totalContributions: 0,
    activeContributors: 0,
  }

  const currentBattles = villageState?.battles || []

  // Initialize village if not exists
  if (!villageState?.currentVillage && tenant_id && aggregate_id) {
    const createCommand: CreateVillageCommand = {
      type: 'village/create',
      tenant_id,
      aggregate_id,
      name: 'Lexicon Village',
      description: 'A multilingual community building bridges through language',
      userId: tenant_id,
    }
    villageStore.dispatch(createCommand)
  }

  const renderCommunityBridge = () => (
    <div className="village__community">
      <div className="village__current-word">
        <h2 className="village__section-title">{t('village.currentWord.title')}</h2>
        <div className="village__word-card">
          <div className="village__word-header">
            <h3 className="village__word">{currentVillage.currentWord?.word}</h3>
            <span className="village__language">{currentVillage.currentWord?.language}</span>
          </div>
          <p className="village__deadline">
            {t('village.currentWord.deadline')}: {new Date(currentVillage.currentWord?.deadline || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="village__contributions">
        <h3 className="village__section-title">{t('village.contributions.title')}</h3>
        <div className="village__contribution-list">
          {currentVillage.currentWord?.contributions.map((contribution) => (
            <div key={contribution.id} className="village__contribution">
              <div className="village__contribution-header">
                <span className="village__contributor">{contribution.userName}</span>
                <span className="village__votes">{contribution.votes} votes</span>
              </div>
              <p className="village__definition">{contribution.definition}</p>
              {contribution.translation && (
                <p className="village__translation">
                  <strong>{t('village.contributions.translation')}:</strong> {contribution.translation}
                </p>
              )}
              <div className="village__contribution-actions">
                <Button variant="ghost" className="village__action-btn">
                  {t('village.contributions.voteUp')}
                </Button>
                <Button variant="ghost" className="village__action-btn">
                  {t('village.contributions.addTranslation')}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button className="village__contribute-btn">
          {t('village.contributions.addDefinition')}
        </Button>
      </div>
    </div>
  )

  const renderVillageBattles = () => (
    <div className="village__battles">
      <h2 className="village__section-title">{t('village.battles.title')}</h2>
      <div className="village__battle-list">
        {currentBattles.map((battle) => (
          <div key={battle.id} className="village__battle-card">
            <div className="village__battle-header">
              <h3 className="village__battle-name">{battle.name}</h3>
              <span className={`village__battle-status village__battle-status--${battle.status}`}>
                {t(`village.battles.status.${battle.status}`)}
              </span>
            </div>
            <p className="village__battle-description">{battle.description}</p>
            <div className="village__battle-time">
              <p>
                {t('village.battles.startTime')}: {new Date(battle.startTime).toLocaleString()}
              </p>
              <p>
                {t('village.battles.duration')}: {Math.round((battle.endTime - battle.startTime) / (60 * 60 * 1000))}h
              </p>
            </div>
            <Button 
              variant={battle.status === 'upcoming' ? 'primary' : 'ghost'}
              disabled={battle.status !== 'upcoming'}
            >
              {battle.status === 'upcoming' ? t('village.battles.join') : t('village.battles.viewDetails')}
            </Button>
          </div>
        ))}
      </div>
      <div className="village__battles-placeholder">
        <p>{t('village.battles.moreComing')}</p>
        <Button variant="ghost">
          {t('village.battles.suggestBattle')}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="page">
      {/* Village Overview Panel */}
      <div className="panel">
        <div className="village__overview">
          <div className="village__identity">
            <h2 className="village__name">{currentVillage.name}</h2>
            <p className="village__description">{currentVillage.description}</p>
          </div>
          <div className="village__stats">
            <div className="village__stat">
              <span className="village__stat-number">{currentVillage.memberCount}</span>
              <span className="village__stat-label">{t('village.stats.villagers')}</span>
            </div>
            <div className="village__stat">
              <span className="village__stat-number">{currentVillage.totalContributions}</span>
              <span className="village__stat-label">{t('village.stats.contributions')}</span>
            </div>
            <div className="village__stat">
              <span className="village__stat-number">{currentVillage.activeContributors}</span>
              <span className="village__stat-label">{t('village.stats.activeToday')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="panel">
        <div className="village__tabs">
          <button
            className={`village__tab ${activeTab === 'community' ? 'village__tab--active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            {t('village.tabs.community') || 'Community'}
          </button>
          <button
            className={`village__tab ${activeTab === 'battles' ? 'village__tab--active' : ''}`}
            onClick={() => setActiveTab('battles')}
          >
            {t('village.tabs.battles') || 'Battles'}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="village__content">
        {activeTab === 'community' && renderCommunityBridge()}
        {activeTab === 'battles' && renderVillageBattles()}
      </div>
    </div>
  )
}

// Apply memo to prevent double execution from BaseLayout re-renders
export default memo(VillagePage)
