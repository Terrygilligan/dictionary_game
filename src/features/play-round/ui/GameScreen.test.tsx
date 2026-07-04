import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { GameScreen } from './GameScreen.tsx'
import { GameProvider } from '../model/GameProvider.tsx'
import { seededRng } from '@/shared/lib'

afterEach(cleanup)

function renderGame(roundCount: number) {
  return render(
    <GameProvider>
      <GameScreen deckOptions={{ roundCount, choicesPerRound: 4, rng: seededRng(3) }} />
    </GameProvider>,
  )
}

describe('<GameScreen>', () => {
  it('walks from start to a perfect result when the correct choice is picked', () => {
    renderGame(3)

    fireEvent.click(screen.getByTestId('start-button'))

    for (let round = 0; round < 3; round += 1) {
      expect(screen.getByTestId('streak')).toHaveTextContent(
        round === 0 ? 'No streak' : `${round} streak`,
      )
      const correct = screen
        .getAllByTestId('choice')
        .find((el) => el.getAttribute('data-correct') === 'true')
      expect(correct).toBeDefined()
      fireEvent.click(correct!)
      expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!')
      expect(screen.getByTestId('streak')).toHaveTextContent(`${round + 1} streak`)
      fireEvent.click(screen.getByTestId('next-button'))
    }

    expect(screen.getByTestId('final-score')).toHaveTextContent('3 / 3')
  })

  it('locks the round after answering and shows incorrect feedback', () => {
    renderGame(1)
    fireEvent.click(screen.getByTestId('start-button'))

    const wrong = screen
      .getAllByTestId('choice')
      .find((el) => el.getAttribute('data-correct') === 'false')
    fireEvent.click(wrong!)

    expect(screen.getByTestId('feedback')).toHaveTextContent('Not quite.')
    for (const choice of screen.getAllByTestId('choice')) {
      expect(choice).toBeDisabled()
    }
  })

  it('can be restarted from the result screen', () => {
    renderGame(1)
    fireEvent.click(screen.getByTestId('start-button'))
    const anyChoice = screen.getAllByTestId('choice')[0]!
    fireEvent.click(anyChoice)
    fireEvent.click(screen.getByTestId('next-button'))

    const result = screen.getByTestId('final-score')
    expect(result).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('play-again-button'))
    expect(within(document.body).getByTestId('term')).toBeInTheDocument()
  })
})
