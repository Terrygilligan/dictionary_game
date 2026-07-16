// Test script to verify NAV_START events are working
window.addEventListener('NAV_START', (event) => {
  console.log('🧪 [TEST] NAV_START event received:', event.detail)
})

// Test navigation by simulating button clicks
setTimeout(() => {
  console.log('🧪 [TEST] Simulating navigation clicks...')
  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    if (button.textContent?.includes('Play') || button.textContent?.includes('Home')) {
      console.log('🧪 [TEST] Found navigation button:', button.textContent)
      button.click()
    }
  })
}, 2000)
