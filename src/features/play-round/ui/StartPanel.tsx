import { Button } from '@/shared/ui'

export interface StartPanelProps {
  onStart: () => void
}

export function StartPanel({ onStart }: StartPanelProps) {
  return (
    <section className="panel panel--center" aria-labelledby="start-title">
      <h2 id="start-title" className="panel__title">
        Ready to test your vocabulary?
      </h2>
      <p className="panel__lead">
        You&rsquo;ll be shown a word and four definitions. Pick the one that fits.
      </p>
      <Button onClick={onStart} data-testid="start-button">
        Start game
      </Button>
    </section>
  )
}
