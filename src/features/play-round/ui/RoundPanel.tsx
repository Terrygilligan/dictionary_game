import type { AnswerRecord, RoundSpec } from '@/entities/game'
import { Button } from '@/shared/ui'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'

export interface RoundPanelProps {
  round: RoundSpec
  answer: AnswerRecord | null
  progress: { current: number; total: number }
  score: number
  streak: number
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
  streak,
  isLastRound,
  onSelect,
  onNext,
}: RoundPanelProps) {
  const { t } = useTranslate()
  const answered = answer !== null

  return (
    <section className="panel" aria-labelledby="round-term">
      <header className="round__header">
        <span className="round__progress" data-testid="progress">
          {t('quiz.roundPanel.progress', { current: progress.current, total: progress.total })}
        </span>
        <span className="round__streak" data-testid="streak">
          {streak > 0 ? `\u{1F525} ${t('quiz.roundPanel.streak', { streak })}` : t('quiz.roundPanel.noStreak')}
        </span>
        <span className="round__score" data-testid="score">
          {t('quiz.roundPanel.score', { score })}
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
            {answer.correct ? t('quiz.roundPanel.correct') : t('quiz.roundPanel.incorrect')}
          </p>
          <Button onClick={onNext} data-testid="next-button">
            {isLastRound ? t('quiz.roundPanel.seeResults') : t('quiz.roundPanel.next')}
          </Button>
        </footer>
      ) : null}
    </section>
  )
}
