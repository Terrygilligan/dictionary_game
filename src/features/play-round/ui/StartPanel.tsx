import { Button } from '@/shared/ui'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export interface StartPanelProps {
  onStart: () => void
}

export function StartPanel({ onStart }: StartPanelProps) {
  const { t } = useTranslate()
  return (
    <section className="panel panel--center" aria-labelledby="start-title">
      <h2 id="start-title" className="panel__title">
        {t('quiz.startPanel.title')}
      </h2>
      <p className="panel__lead">
        {t('quiz.startPanel.description')}
      </p>
      <Button onClick={onStart} data-testid="start-button">
        {t('quiz.startPanel.startButton')}
      </Button>
    </section>
  )
}
