import { useTranslate } from '@/shared/lib/i18n/useTranslate'

/**
 * Loading skeleton shown while identity is resolving.
 * Prevents GameStatsTracker from mounting before tenant_id is available.
 */
export function GameStatsLoadingSkeleton() {
  const { t } = useTranslate()
  
  return (
    <div className="panel panel--center">
      <div className="game-stats-loading">
        <div className="game-stats-loading__spinner"></div>
        <p className="game-stats-loading__text">
          {t('ui.loading')}
        </p>
        <p className="game-stats-loading__subtext">
          {t('game.initializingIdentity')}
        </p>
      </div>
    </div>
  )
}
