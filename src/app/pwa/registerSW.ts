/**
 * Registers the Lexicon Master service worker. Runs in production builds only —
 * during development the SW is skipped so it can't interfere with Vite's HMR.
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
