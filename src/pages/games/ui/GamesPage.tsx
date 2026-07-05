import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'

export function GamesPage() {
  const { t } = useTranslate()

  return (
    <div className="page">
      <div className="page__content">
        <h1 className="page__title">{t('games.title')}</h1>
        <p className="page__tagline">{t('games.tagline')}</p>
      </div>
      
      <div className="games-dashboard">
        {/* Quick Play Zone */}
        <section className="games-dashboard__section">
          <h2 className="games-dashboard__section-title">{t('games.quickPlay.title')}</h2>
          <div className="games-dashboard__quick-play">
            <div className="game-card game-card--large">
              <div className="game-card__content">
                <h3 className="game-card__title">{t('games.modes.solo.title')}</h3>
                <p className="game-card__description">{t('games.modes.solo.description')}</p>
                <div className="game-card__stats">
                  <span className="game-card__stat">{t('games.modes.solo.duration')}</span>
                  <span className="game-card__stat">{t('games.modes.solo.difficulty')}</span>
                </div>
                <Button className="game-card__button">
                  {t('games.playNow')}
                </Button>
              </div>
            </div>
            
            <div className="game-card game-card--large">
              <div className="game-card__content">
                <h3 className="game-card__title">{t('games.modes.versus.title')}</h3>
                <p className="game-card__description">{t('games.modes.versus.description')}</p>
                <div className="game-card__stats">
                  <span className="game-card__stat">{t('games.modes.versus.players')}</span>
                  <span className="game-card__stat">{t('games.modes.versus.duration')}</span>
                </div>
                <Button className="game-card__button">
                  {t('games.playNow')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Community Bridge */}
        <section className="games-dashboard__section">
          <h2 className="games-dashboard__section-title">{t('games.communityBridge.title')}</h2>
          <div className="games-dashboard__community">
            <div className="community-card">
              <div className="community-card__header">
                <h3 className="community-card__title">{t('games.communityBridge.currentWord')}</h3>
                <span className="community-card__language">{t('games.communityBridge.language')}</span>
              </div>
              <div className="community-card__content">
                <div className="community-card__word">
                  <span className="community-card__term">Bridge</span>
                  <span className="community-card__translation">Brug</span>
                </div>
                <div className="community-card__contributions">
                  <span className="community-card__stat">{t('games.communityBridge.contributions')}</span>
                  <span className="community-card__count">42</span>
                </div>
                <Button variant="ghost" className="community-card__button">
                  {t('games.communityBridge.contribute')}
                </Button>
              </div>
            </div>
            
            <div className="community-highlights">
              <h4 className="community-highlights__title">{t('games.communityBridge.recentContributions')}</h4>
              <div className="community-highlights__list">
                <div className="contribution-item">
                  <span className="contribution-item__word">Village</span>
                  <span className="contribution-item__translation">Dorp</span>
                  <span className="contribution-item__author">- Maria</span>
                </div>
                <div className="contribution-item">
                  <span className="contribution-item__word">Community</span>
                  <span className="contribution-item__translation">Gemeenschap</span>
                  <span className="contribution-item__author">- Jan</span>
                </div>
                <div className="contribution-item">
                  <span className="contribution-item__word">Learning</span>
                  <span className="contribution-item__translation">Leren</span>
                  <span className="contribution-item__author">- Sophie</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Active Rooms */}
        <section className="games-dashboard__section">
          <h2 className="games-dashboard__section-title">{t('games.activeRooms.title')}</h2>
          <div className="games-dashboard__rooms">
            <div className="rooms-placeholder">
              <div className="rooms-placeholder__icon">🎮</div>
              <h3 className="rooms-placeholder__title">{t('games.activeRooms.comingSoon')}</h3>
              <p className="rooms-placeholder__description">{t('games.activeRooms.description')}</p>
              <Button variant="ghost" disabled>
                {t('games.activeRooms.notifyMe')}
              </Button>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="games-dashboard__section">
          <h2 className="games-dashboard__section-title">{t('games.recentActivity.title')}</h2>
          <div className="games-dashboard__activity">
            <div className="activity-feed">
              <div className="activity-item">
                <div className="activity-item__icon">🏆</div>
                <div className="activity-item__content">
                  <span className="activity-item__text">{t('games.activity.newHighScore')}</span>
                  <span className="activity-item__details">Solo Sprint - 1,250 points</span>
                </div>
                <span className="activity-item__time">2m ago</span>
              </div>
              <div className="activity-item">
                <div className="activity-item__icon">🤝</div>
                <div className="activity-item__content">
                  <span className="activity-item__text">{t('games.activity.communityContribution')}</span>
                  <span className="activity-item__details">Added Dutch translation for "Bridge"</span>
                </div>
                <span className="activity-item__time">15m ago</span>
              </div>
              <div className="activity-item">
                <div className="activity-item__icon">🎯</div>
                <div className="activity-item__content">
                  <span className="activity-item__text">{t('games.activity.streakAchievement')}</span>
                  <span className="activity-item__details">7-day streak maintained!</span>
                </div>
                <span className="activity-item__time">1h ago</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
