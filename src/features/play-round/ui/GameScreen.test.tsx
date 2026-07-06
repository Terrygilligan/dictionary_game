import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { GameScreen } from './GameScreen.tsx'
import { GameProvider } from '../model/GameProvider.tsx'
import { seededRng } from '@/shared/lib'

// Mock useTranslate to provide actual English translations
vi.mock('@/shared/lib/i18n/useTranslate', () => ({
  useTranslate: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'quiz.roundPanel.noStreak': 'No streak',
        'quiz.roundPanel.incorrect': 'Not quite.',
        'quiz.roundPanel.correct': 'Correct!',
        'quiz.roundPanel.streak': '🔥 {count} streak',
        'quiz.startPanel.start': 'Start Game',
        'quiz.resultPanel.playAgain': 'Play Again',
      }
      let translation = translations[key] || key
      
      // Handle parameter interpolation
      if (params && translation.includes('{count}')) {
        translation = translation.replace('{count}', String(params.count || 1))
      }
      
      return translation
    },
    currentLanguage: 'en',
    setLanguage: () => Promise.resolve(),
    availableLanguages: ['en'],
    getLanguageDisplayName: () => 'English',
    exists: () => true,
  }),
}))

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
      if (round === 0) {
        expect(screen.getByTestId('streak')).toHaveTextContent('No streak')
      } else {
        expect(screen.getByTestId('streak')).toHaveTextContent(/streak/i)
      }
      const correct = screen
        .getAllByTestId('choice')
        .find((el) => el.getAttribute('data-correct') === 'true')
      expect(correct).toBeDefined()
      fireEvent.click(correct!)
      expect(screen.getByTestId('feedback')).toHaveTextContent('Correct!')
      expect(screen.getByTestId('streak')).toHaveTextContent(/streak/i)
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
