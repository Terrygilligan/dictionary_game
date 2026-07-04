import type { AnswerRecord, RoundSpec } from '@/entities/game'
import { Button } from '@/shared/ui'

export interface RoundPanelProps {
  round: RoundSpec
  answer: AnswerRecord | null
  progress: { current: number; total: number }
  score: number
  isLastRound: boolean
  onSelect: (choiceId: string) => void
  onNext: () => void
}

function choiceModifier(
  choiceId: string,
  correct: boolean,
  answer: AnswerRecord | null,
): string {
  if (!answer) return ''
  if (correct) return ' choice--correct'
  if (answer.choiceId === choiceId) return ' choice--incorrect'
  return ' choice--muted'
}

export function RoundPanel({
  round,
  answer,
  progress,
  score,
  isLastRound,
  onSelect,
  onNext,
}: RoundPanelProps) {
  const answered = answer !== null

  return (
    <section className="panel" aria-labelledby="round-term">
      <header className="round__header">
        <span className="round__progress" data-testid="progress">
          Round {progress.current} / {progress.total}
        </span>
        <span className="round__score" data-testid="score">
          Score {score}
        </span>
      </header>

      <h2 id="round-term" className="round__term" data-testid="term">
        {round.term}
      </h2>
      <p className="round__pos">{round.partOfSpeech}</p>

      <ul className="choices">
        {round.choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              className={`choice${choiceModifier(choice.id, choice.correct, answer)}`}
              disabled={answered}
              aria-pressed={answer?.choiceId === choice.id}
              onClick={() => onSelect(choice.id)}
              data-testid="choice"
              data-correct={choice.correct}
            >
              {choice.text}
            </button>
          </li>
        ))}
      </ul>

      {answered ? (
        <footer className="round__footer">
          <p
            className={`round__feedback ${answer.correct ? 'is-correct' : 'is-incorrect'}`}
            role="status"
            data-testid="feedback"
          >
            {answer.correct ? 'Correct!' : 'Not quite.'}
          </p>
          <Button onClick={onNext} data-testid="next-button">
            {isLastRound ? 'See results' : 'Next word'}
          </Button>
        </footer>
      ) : null}
    </section>
  )
}
