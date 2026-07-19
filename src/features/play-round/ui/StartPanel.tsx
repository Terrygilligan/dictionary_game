import { Button } from '@/shared/ui'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export interface StartPanelProps {
  onStart: () => void | Promise<void>
  isLoading?: boolean
}

export function StartPanel({ onStart, isLoading = false }: StartPanelProps) {
  const { t } = useTranslate()
  
  const handleClick = () => {
    onStart()
  }
  
  return (
    <section className="panel panel--center" aria-labelledby="start-title">
      <h2 id="start-title" className="panel__title">
        {t('quiz.startPanel.title')}
      </h2>
      <p className="panel__lead">
        {t('quiz.startPanel.description')}
      </p>
      <Button 
        onClick={handleClick} 
        disabled={isLoading}
        data-testid="start-button"
      >
        {isLoading ? t('quiz.startPanel.loadingButton') || 'Loading...' : t('quiz.startPanel.startButton')}
      </Button>
    </section>
  )
}
