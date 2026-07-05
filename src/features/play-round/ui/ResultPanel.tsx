import { Button } from '@/shared/ui'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export interface ResultPanelProps {
  score: number
  total: number
  onPlayAgain: () => void
}

function verdict(ratio: number, t: any): string {
  if (ratio === 1) return t('quiz.resultPanel.verdict.flawless')
  if (ratio >= 0.7) return t('quiz.resultPanel.verdict.strong')
  if (ratio >= 0.4) return t('quiz.resultPanel.verdict.notBad')
  return t('quiz.resultPanel.verdict.plentyToLearn')
}

export function ResultPanel({ score, total, onPlayAgain }: ResultPanelProps) {
  const { t } = useTranslate()
  const ratio = total > 0 ? score / total : 0
  return (
    <section className="panel panel--center" aria-labelledby="result-title">
      <h2 id="result-title" className="panel__title">
        {t('quiz.resultPanel.title')}
      </h2>
      <p className="result__score" data-testid="final-score">
        {score} / {total}
      </p>
      <p className="panel__lead">{verdict(ratio, t)}</p>
      <Button onClick={onPlayAgain} data-testid="play-again-button">
        {t('quiz.resultPanel.playAgain')}
      </Button>
    </section>
  )
}
