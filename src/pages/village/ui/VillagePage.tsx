import { useState } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import type { Village, VillageBattle } from '@/entities/village'

export function VillagePage() {
  const { t } = useTranslate()
  const [activeTab, setActiveTab] = useState<'community' | 'battles'>('community')

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

      {/* Tab Navigation */}
      <div className="panel">
        <div className="village__tabs">
          <button
            className={`village__tab ${activeTab === 'community' ? 'village__tab--active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            {t('village.tabs.community')}
          </button>
          <button
            className={`village__tab ${activeTab === 'battles' ? 'village__tab--active' : ''}`}
            onClick={() => setActiveTab('battles')}
          >
            {t('village.tabs.battles')}
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
