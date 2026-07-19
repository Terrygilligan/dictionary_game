import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { useNavigation } from '@/shared/lib/navigation'
import { createLogger } from '@/shared/lib/logger'
import { guestSessionService } from '@/services/GuestSessionService'

const logger = createLogger('GAMES_PAGE')

export function GamesPage() {
  const { t } = useTranslate()
  const { navigate } = useNavigation()
  
  // State Audit: Log button state and DOM node
  console.log('[DEBUG_STATE]', { 
    isReady: true, 
    status: 'ready', 
    DOM_node: document.querySelector('.game-card__button') 
  })

  const handleSoloGameClick = () => {
    logger.log('Solo game button clicked, checking guest limit', { path: 'game', mode: 'solo' })
    
    // Check if guest can start a new game
    if (!guestSessionService.canStartGame()) {
      const gamesPlayed = guestSessionService.getGamesPlayed()
      const maxGames = guestSessionService.getMaxGames()
      const remaining = guestSessionService.getRemainingGames()
      alert(`Guest play is limited to ${maxGames} games. You have played ${gamesPlayed} games (${remaining} remaining). Please sign in to continue playing unlimited games.`)
      logger.log('Guest limit reached, blocking navigation', { gamesPlayed, maxGames, remaining })
      return
    }
    
    // Record the game and navigate
    guestSessionService.recordGamePlayed()
    logger.log('Guest game recorded, navigating to game page', { path: 'game', mode: 'solo' })
    navigate('game')
  }

  const handleVersusGameClick = () => {
    logger.log('Versus game button clicked, checking guest limit', { path: 'game', mode: 'versus' })
    
    // Check if guest can start a new game
    if (!guestSessionService.canStartGame()) {
      const gamesPlayed = guestSessionService.getGamesPlayed()
      const maxGames = guestSessionService.getMaxGames()
      const remaining = guestSessionService.getRemainingGames()
      alert(`Guest play is limited to ${maxGames} games. You have played ${gamesPlayed} games (${remaining} remaining). Please sign in to continue playing unlimited games.`)
      logger.log('Guest limit reached, blocking navigation', { gamesPlayed, maxGames, remaining })
      return
    }
    
    // Record the game and navigate
    guestSessionService.recordGamePlayed()
    logger.log('Guest game recorded, navigating to game page', { path: 'game', mode: 'versus' })
    navigate('game')
  }

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
            <div className="game-card game-card--large game-card--solo">
              <div className="game-card__icon">🏃‍♂️</div>
              <div className="game-card__content">
                <h3 className="game-card__title">{t('games.modes.solo.title')}</h3>
                <p className="game-card__description">{t('games.modes.solo.description')}</p>
                <div className="game-card__stats">
                  <span className="game-card__stat">{t('games.modes.solo.duration')}</span>
                  <span className="game-card__stat">{t('games.modes.solo.difficulty')}</span>
                </div>
                <Button className="game-card__button" onClick={handleSoloGameClick} type="button">
                  {t('games.playNow')}
                </Button>
              </div>
            </div>
            
            <div className="game-card game-card--large game-card--versus">
              <div className="game-card__icon">⚔️</div>
              <div className="game-card__content">
                <h3 className="game-card__title">{t('games.modes.versus.title')}</h3>
                <p className="game-card__description">{t('games.modes.versus.description')}</p>
                <div className="game-card__stats">
                  <span className="game-card__stat">{t('games.modes.versus.players')}</span>
                  <span className="game-card__stat">{t('games.modes.versus.duration')}</span>
                </div>
                <Button className="game-card__button" onClick={handleVersusGameClick} type="button">
                  {t('games.playNow')}
                </Button>
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
