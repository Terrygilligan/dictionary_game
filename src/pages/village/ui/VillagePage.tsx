import { useState, useEffect, memo } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import type { Village, VillageBattle } from '@/entities/village'
import { useNavigation } from '@/shared/lib/navigation'

export function VillagePage() {
  const { t } = useTranslate()
  const { currentPage } = useNavigation()
  const [activeTab, setActiveTab] = useState<'community' | 'battles'>('community')

  // Ghost render detection
  if (currentPage !== 'village') {
    console.error('🏘️ [VILLAGE] GHOST RENDER DETECTED - currentPage:', currentPage, 'expected: village')
    return null
  }

  // Debug: Check if currentPage is actually changing
  useEffect(() => {
    console.log('🔄 [VILLAGE] Page changed to:', currentPage)
    console.log('🔄 [VILLAGE] Should render:', currentPage === 'village' ? 'VillagePage' : 'Other page')
  }, [currentPage])

  // Debug: Log when VillagePage mounts/unmounts
  useEffect(() => {
    console.log('🏘️ [VILLAGE] VillagePage MOUNTED - Fresh component instance')
    console.log('🏘️ [VILLAGE] Current page:', currentPage)
    console.log('🏘️ [VILLAGE] State isolation: NO user context accessed')
    console.log('🏘️ [VILLAGE] Active tab:', activeTab)
    
    return () => {
      console.log('🏘️ [VILLAGE] VillagePage UNMOUNTED - Component cleanup')
    }
  }, [currentPage, activeTab])

  // Debug: Log tab changes
  useEffect(() => {
    console.log('🔄 [VILLAGE] Tab changed to:', activeTab)
  }, [activeTab])

  // Mock data - in real app this would come from village entity/store
  const mockVillage: Village = {
    id: 'village_main',
    name: 'Lexicon Village',
    description: 'A multilingual community building bridges through language',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    memberCount: 127,
    totalContributions: 892,
    activeContributors: 43,
    currentWord: {
      id: 'word_today',
      word: 'community',
      language: 'English',
      createdAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      contributions: [
        {
          id: 'contrib_1',
          userId: 'user_1',
          userName: 'Maria',
          definition: 'A group of people living together and sharing common interests',
          createdAt: Date.now() - 90 * 60 * 1000,
          votes: 12,
          isApproved: true,
        },
        {
          id: 'contrib_2',
          userId: 'user_2',
          userName: 'Hans',
          definition: 'Gemeinschaft - people united by shared goals and values',
          translation: 'Gemeinschaft',
          createdAt: Date.now() - 60 * 60 * 1000,
          votes: 8,
          isApproved: true,
        },
      ],
      deadline: Date.now() + 22 * 60 * 60 * 1000, // 22 hours from now
    },
  }

  const mockBattles: VillageBattle[] = [
    {
      id: 'battle_1',
      name: 'Weekend Vocabulary Sprint',
      description: 'Fast-paced definition challenge with village-wide participation',
      startTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
      endTime: Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2 hours later
      status: 'upcoming',
      participants: [],
      rules: [],
    },
    {
      id: 'battle_2',
      name: 'Multilingual Masters',
      description: 'Test your skills across all supported languages',
      startTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000, // 3 hours later
      status: 'upcoming',
      participants: [],
      rules: [],
    },
  ]

  const renderCommunityBridge = () => (
    <div className="village__community">
      <div className="village__current-word">
        <h2 className="village__section-title">{t('village.currentWord.title')}</h2>
        <div className="village__word-card">
          <div className="village__word-header">
            <h3 className="village__word">{mockVillage.currentWord?.word}</h3>
            <span className="village__language">{mockVillage.currentWord?.language}</span>
          </div>
          <p className="village__deadline">
            {t('village.currentWord.deadline')}: {new Date(mockVillage.currentWord?.deadline || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="village__contributions">
        <h3 className="village__section-title">{t('village.contributions.title')}</h3>
        <div className="village__contribution-list">
          {mockVillage.currentWord?.contributions.map((contribution) => (
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
        {mockBattles.map((battle) => (
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
            <h2 className="village__name">{mockVillage.name}</h2>
            <p className="village__description">{mockVillage.description}</p>
          </div>
          <div className="village__stats">
            <div className="village__stat">
              <span className="village__stat-number">{mockVillage.memberCount}</span>
              <span className="village__stat-label">{t('village.stats.villagers')}</span>
            </div>
            <div className="village__stat">
              <span className="village__stat-number">{mockVillage.totalContributions}</span>
              <span className="village__stat-label">{t('village.stats.contributions')}</span>
            </div>
            <div className="village__stat">
              <span className="village__stat-number">{mockVillage.activeContributors}</span>
              <span className="village__stat-label">{t('village.stats.activeToday')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - FORCE VISIBLE */}
      <div style={{ 
        position: 'fixed', 
        top: '100px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 9999,
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        padding: '2rem',
        border: '3px solid yellow',
        borderRadius: '8px',
        fontSize: '1.5rem'
      }}>
        🚨 TABS ARE HERE! 🚨
        <div style={{ marginTop: '1rem', fontSize: '1rem' }}>
          Active Tab: {activeTab}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={() => setActiveTab('community')}
            style={{ 
              backgroundColor: 'green', 
              color: 'white', 
              border: '2px solid white', 
              padding: '0.5rem 1rem', 
              margin: '0.25rem',
              cursor: 'pointer'
            }}
          >
            COMMUNITY TAB
          </button>
          <button 
            onClick={() => setActiveTab('battles')}
            style={{ 
              backgroundColor: 'orange', 
              color: 'white', 
              border: '2px solid white', 
              padding: '0.5rem 1rem', 
              margin: '0.25rem',
              cursor: 'pointer'
            }}
          >
            BATTLES TAB
          </button>
        </div>
      </div>

      {/* Original Tab Navigation */}
      <div className="panel">
        <div className="village__tabs">
          <button
            className={`village__tab ${activeTab === 'community' ? 'village__tab--active' : ''}`}
            onClick={() => {
              console.log('🏘️ [VILLAGE] Community tab clicked')
              setActiveTab('community')
            }}
          >
            {t('village.tabs.community') || 'Community'}
          </button>
          <button
            className={`village__tab ${activeTab === 'battles' ? 'village__tab--active' : ''}`}
            onClick={() => {
              console.log('🏘️ [VILLAGE] Battles tab clicked')
              setActiveTab('battles')
            }}
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
