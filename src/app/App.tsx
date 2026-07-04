import { GamePage } from '@/pages/game'
import { AppProviders } from './providers/AppProviders.tsx'
import './styles/index.css'

export function App() {
  return (
    <AppProviders>
      <GamePage />
    </AppProviders>
  )
}
