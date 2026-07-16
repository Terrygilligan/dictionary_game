// Navigation Flow Verification - Monitor complete sequence
console.log('🔄 [FLOW_VERIFY] Starting navigation flow verification')

let flowEvents = []
let activeTabStates = []

// Monitor all navigation events
window.addEventListener('NAV_START', (event) => {
  flowEvents.push({
    type: 'NAV_START',
    timestamp: Date.now(),
    detail: event.detail
  })
  console.log(`🔄 [FLOW_VERIFY] 🚀 NAV_START: ${event.detail.from} → ${event.detail.to}`)
})

window.addEventListener('NAV_COMPLETE', (event) => {
  flowEvents.push({
    type: 'NAV_COMPLETE',
    timestamp: Date.now(),
    detail: event.detail
  })
  console.log(`🔄 [FLOW_VERIFY] 🎯 NAV_COMPLETE: ${event.detail.from} → ${event.detail.to}`)
})

// Monitor header tab changes
const headerObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const target = mutation.target
      if (target.classList.contains('header__nav-link')) {
        const isActive = target.classList.contains('header__nav-link--active')
        const tabText = target.textContent?.trim()
        
        if (isActive) {
          activeTabStates.push({
            tab: tabText,
            timestamp: Date.now(),
            event: 'TAB_ACTIVATED'
          })
          console.log(`🔄 [FLOW_VERIFY] 📌 Tab activated: ${tabText}`)
        }
      }
    }
  })
})

headerObserver.observe(document.body, {
  attributes: true,
  subtree: true,
  attributeFilter: ['class']
})

// Monitor layout re-renders
const layoutObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('app')) {
          console.log(`🔄 [FLOW_VERIFY] 🔄 Layout re-render detected`)
        }
      })
    }
  })
})

layoutObserver.observe(document.body, {
  childList: true,
  subtree: true
})

// Trigger test navigation after 3 seconds
setTimeout(() => {
  console.log('🔄 [FLOW_VERIFY] Triggering test navigation...')
  
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🔄 [FLOW_VERIFY] Clicking Profile button')
    profileBtn.click()
  }
}, 3000)

// Analyze flow after 8 seconds
setTimeout(() => {
  console.log('🔄 [FLOW_VERIFY] === FLOW ANALYSIS ===')
  
  // Check event sequence
  const navStartEvents = flowEvents.filter(e => e.type === 'NAV_START')
  const navCompleteEvents = flowEvents.filter(e => e.type === 'NAV_COMPLETE')
  
  console.log(`🔄 [FLOW_VERIFY] NAV_START events: ${navStartEvents.length}`)
  console.log(`🔄 [FLOW_VERIFY] NAV_COMPLETE events: ${navCompleteEvents.length}`)
  console.log(`🔄 [FLOW_VERIFY] Tab activations: ${activeTabStates.length}`)
  
  // Analyze timing
  if (navStartEvents.length > 0 && navCompleteEvents.length > 0) {
    const navStartTime = navStartEvents[0].timestamp
    const navCompleteTime = navCompleteEvents[0].timestamp
    const timingDiff = navCompleteTime - navStartTime
    
    console.log(`🔄 [FLOW_VERIFY] Navigation timing: ${timingDiff}ms`)
    
    // Check expected sequence
    if (timingDiff > 0) {
      console.log('🔄 [FLOW_VERIFY] ✅ NAV_COMPLETE after NAV_START - Correct sequence')
    } else {
      console.log('🔄 [FLOW_VERIFY] ❌ NAV_COMPLETE before NAV_START - Wrong sequence')
    }
  }
  
  // Check tab synchronization
  if (activeTabStates.length > 0) {
    const lastTab = activeTabStates[activeTabStates.length - 1]
    console.log(`🔄 [FLOW_VERIFY] Last active tab: ${lastTab.tab}`)
    
    // Check if tab activation corresponds to navigation
    if (navCompleteEvents.length > 0) {
      const targetPage = navCompleteEvents[0].detail.to
      const expectedTab = targetPage.charAt(0).toUpperCase() + targetPage.slice(1)
      
      if (lastTab.tab.includes(expectedTab)) {
        console.log('🔄 [FLOW_VERIFY] ✅ Tab synchronized with navigation')
      } else {
        console.log(`🔄 [FLOW_VERIFY] ❌ Tab mismatch - Expected: ${expectedTab}, Got: ${lastTab.tab}`)
      }
    }
  }
  
  // Cleanup
  headerObserver.disconnect()
  layoutObserver.disconnect()
  
  console.log('🔄 [FLOW_VERIFY] Flow verification complete')
}, 8000)
