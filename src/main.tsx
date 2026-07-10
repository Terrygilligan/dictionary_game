import { createRoot } from 'react-dom/client'
import { App } from './app'
import { registerServiceWorker } from './app/pwa/registerSW.ts'

console.log('⚡ [MAIN] App entry point reached')

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <App />
)

registerServiceWorker()
