// Header-Content Synchronization Simulation
console.log('🔍 [SYNC_SIM] Starting header-content synchronization analysis')

let navigationEvents = []
let headerStates = []
let contentStates = []

// Track NavigationContext state changes
const originalUseNavigation = window.useNavigation
if (window.useNavigation) {
  console.log('🔍 [SYNC_SIM] Found useNavigation hook')
}

// Monitor navigation events
window.addEventListener('NAV_START', (event) => {
  navigationEvents.push({
    type: 'NAV_START',
    timestamp: Date.now(),
    detail: event.detail
  })
  console.log('🔍 [SYNC_SIM] NAV_START:', event.detail)
})

// Monitor DOM changes for header tabs
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const target = mutation.target
      if (target.classList.contains('header__nav-link')) {
        const isActive = target.classList.contains('header__nav-link--active')
        const tabText = target.textContent
        headerStates.push({
          tab: tabText,
          isActive: isActive,
          timestamp: Date.now(),
          element: target.tagName + '.' + target.className
        })
        console.log(`🔍 [SYNC_SIM] Header tab "${tabText}" active: ${isActive}`)
      }
    }
  })
})

// Start observing the document
observer.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ['class']
})

// Monitor page content changes
const pageContentObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for page content indicators
          const pageText = node.textContent || ''
          if (pageText.includes('Profile') || pageText.includes('Village') || 
              pageText.includes('Games') || pageText.includes('Home')) {
            contentStates.push({
              content: pageText.substring(0, 50),
              timestamp: Date.now(),
              element: node.tagName
            })
            console.log(`🔍 [SYNC_SIM] Content detected: "${pageText.substring(0, 30)}..."`)
          }
        }
      })
    }
  })
})

pageContentObserver.observe(document.body, {
  childList: true,
  subtree: true
})

// Simulate navigation clicks and track timing
setTimeout(() => {
  console.log('🔍 [SYNC_SIM] Starting navigation simulation...')
  
  // Find navigation buttons
  const buttons = document.querySelectorAll('button')
  const navButtons = Array.from(buttons).filter(btn => {
    const text = btn.textContent
    return text && (text.includes('Profile') || text.includes('Village') || text.includes('Home'))
  })
  
  console.log(`🔍 [SYNC_SIM] Found ${navButtons.length} navigation buttons`)
  
  // Click Profile button
  const profileBtn = navButtons.find(btn => btn.textContent.includes('Profile'))
  if (profileBtn) {
    console.log('🔍 [SYNC_SIM] Clicking Profile button')
    profileBtn.click()
  }
  
  // After 2 seconds, click Village button
  setTimeout(() => {
    const villageBtn = navButtons.find(btn => btn.textContent.includes('Village'))
    if (villageBtn) {
      console.log('🔍 [SYNC_SIM] Clicking Village button')
      villageBtn.click()
    }
  }, 2000)
  
  // After 4 seconds, click Profile again
  setTimeout(() => {
    const profileBtn2 = navButtons.find(btn => btn.textContent.includes('Profile'))
    if (profileBtn2) {
      console.log('🔍 [SYNC_SIM] Clicking Profile button again')
      profileBtn2.click()
    }
  }, 4000)
  
}, 3000)

// Report findings after 8 seconds
setTimeout(() => {
  console.log('🔍 [SYNC_SIM] === SIMULATION RESULTS ===')
  console.log(`🔍 [SYNC_SIM] Navigation events: ${navigationEvents.length}`)
  console.log(`🔍 [SYNC_SIM] Header state changes: ${headerStates.length}`)
  console.log(`🔍 [SYNC_SIM] Content changes: ${contentStates.length}`)
  
  // Analyze timing mismatches
  if (navigationEvents.length > 0 && headerStates.length > 0) {
    const firstNavStart = navigationEvents[0].timestamp
    const firstHeaderChange = headerStates[0].timestamp
    
    const timingDiff = firstHeaderChange - firstNavStart
    console.log(`🔍 [SYNC_SIM] Timing difference: ${timingDiff}ms`)
    
    if (timingDiff > 100) {
      console.log('🔍 [SYNC_SIM] ⚠️  HEADER LAG DETECTED - Header updates after navigation')
    }
  }
  
  // Check for state mismatches
  const activeHeaderTabs = headerStates.filter(state => state.isActive)
  console.log('🔍 [SYNC_SIM] Active header tabs sequence:', activeHeaderTabs.map(t => t.tab))
  
  // Cleanup
  observer.disconnect()
  pageContentObserver.disconnect()
  
  console.log('🔍 [SYNC_SIM] Simulation complete')
}, 8000)
