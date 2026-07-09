// Test script to verify Void transition behavior
console.log('🧪 [VOID_TEST] Initializing Void transition test')

let navStartCount = 0
let voidTransitionCount = 0

// Listen for NAV_START events
window.addEventListener('NAV_START', (event) => {
  navStartCount++
  console.log(`🧪 [VOID_TEST] NAV_START #${navStartCount}:`, event.detail)
  
  // Check if void transition happens
  setTimeout(() => {
    const appElement = document.querySelector('.app')
    if (appElement) {
      const content = appElement.textContent || ''
      if (content.includes('Transitioning...')) {
        voidTransitionCount++
        console.log(`🧪 [VOID_TEST] Void transition #${voidTransitionCount} detected!`)
      }
    }
  }, 25) // Check halfway through the 50ms void period
})

// Report results every 10 seconds
setInterval(() => {
  console.log(`🧪 [VOID_TEST] Status - NAV_START: ${navStartCount}, Void transitions: ${voidTransitionCount}`)
}, 10000)

// Test navigation after 3 seconds
setTimeout(() => {
  console.log('🧪 [VOID_TEST] Triggering test navigation...')
  const buttons = document.querySelectorAll('button')
  buttons.forEach(button => {
    const text = button.textContent
    if (text && (text.includes('Play') || text.includes('Home') || text.includes('Village'))) {
      console.log(`🧪 [VOID_TEST] Clicking button: ${text}`)
      button.click()
      return // Only click one button
    }
  })
}, 3000)
