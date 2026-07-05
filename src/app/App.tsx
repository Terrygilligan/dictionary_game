import { AppRouter } from './providers/router'
import { AppProviders } from './providers/AppProviders.tsx'
import './styles/index.css'

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
