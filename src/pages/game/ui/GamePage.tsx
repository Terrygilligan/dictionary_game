import { useState } from 'react'
import { GameScreen } from '@/features/play-round'
import { DictionarySelection } from '@/features/main-game'
import { Button } from '@/shared/ui/Button'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

type GameMode = 'quiz' | 'dictionary'

interface GamePageProps {
  isGuest?: boolean
}

export function GamePage({ isGuest = false }: GamePageProps) {
  const [gameMode, setGameMode] = useState<GameMode>('quiz')
  const { t } = useTranslate()

  // Guest notice
  if (isGuest) {
    return (
      <main className="page">
        <header className="page__masthead">
          <h1 className="page__title">{t('gamePage.title')}</h1>
          <p className="page__tagline">{t('landing.guestPrivacyNotice')}</p>
          <div style={{ marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setGameMode('quiz')}>
              {t('gamePage.switchToDictionary')}
            </Button>
          </div>
        </header>
        <GameScreen />
      </main>
    )
  }

  if (gameMode === 'quiz') {
    return (
      <main className="page">
        <header className="page__masthead">
          <h1 className="page__title">{t('gamePage.title')}</h1>
          <p className="page__tagline">{t('gamePage.tagline')}</p>
          <div style={{ marginTop: '1rem' }}>
            <Button variant="ghost" onClick={() => setGameMode('dictionary')}>
              {t('gamePage.switchToDictionary')}
            </Button>
          </div>
        </header>
        <GameScreen />
      </main>
    )
  }

  return (
    <main className="page">
      <header className="page__masthead">
        <h1 className="page__title">{t('gamePage.dictionaryTitle')}</h1>
        <p className="page__tagline">{t('gamePage.dictionaryTagline')}</p>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="ghost" onClick={() => setGameMode('quiz')}>
            {t('gamePage.switchToQuiz')}
          </Button>
        </div>
      </header>
      <DictionarySelection />
    </main>
  )
}
