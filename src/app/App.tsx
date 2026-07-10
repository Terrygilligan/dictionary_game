import { AppRouter } from './providers/router'
import { AppProviders } from './providers/AppProviders.tsx'
import './styles/index.css'
// DEBUG FLOOD CLEANUP: Comment out all diagnostic scripts that interfere with React initialization
// import '../debug/buttonDiagnostics.js'
// import '../debug/nav-test.js'
// import '../debug/void-transition-test.js'
// import '../debug/header-sync-simulation.js'
// import '../debug/header-analysis.js'
// import '../debug/quick-diagnosis.js'
// import '../debug/navigation-flow-verify.js'
// import '../debug/final-test.js'
// import '../debug/css-class-verify.js'
// import '../debug/css-attribute-verify.js'
// import '../debug/reset-first-verify.js'

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
