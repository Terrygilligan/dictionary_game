import { Button } from '@/shared/ui'

export interface ResultPanelProps {
  score: number
  total: number
  onPlayAgain: () => void
}

function verdict(ratio: number): string {
  if (ratio === 1) return 'Flawless — lexicon mastered!'
  if (ratio >= 0.7) return 'Strong vocabulary!'
  if (ratio >= 0.4) return 'Not bad — keep studying.'
  return 'Plenty of new words to learn.'
}

export function ResultPanel({ score, total, onPlayAgain }: ResultPanelProps) {
  const ratio = total > 0 ? score / total : 0
  return (
    <section className="panel panel--center" aria-labelledby="result-title">
      <h2 id="result-title" className="panel__title">
        Game over
      </h2>
      <p className="result__score" data-testid="final-score">
        {score} / {total}
      </p>
      <p className="panel__lead">{verdict(ratio)}</p>
      <Button onClick={onPlayAgain} data-testid="play-again-button">
        Play again
      </Button>
    </section>
  )
}
