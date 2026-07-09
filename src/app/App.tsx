import { AppRouter } from './providers/router'
import { AppProviders } from './providers/AppProviders.tsx'
import './styles/index.css'
import '../debug/buttonDiagnostics.js'
import '../debug/nav-test.js'
import '../debug/void-transition-test.js'
import '../debug/header-sync-simulation.js'
import '../debug/header-analysis.js'
import '../debug/quick-diagnosis.js'
import '../debug/navigation-flow-verify.js'
import '../debug/final-test.js'
import '../debug/css-class-verify.js'

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
