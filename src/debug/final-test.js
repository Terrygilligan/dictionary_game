// Final Navigation Synchronization Test
console.log('🎯 [FINAL_TEST] Starting final header-content synchronization test')

// Expected sequence: NAV_START -> Void -> Content Swapped -> NAV_COMPLETE -> Layout Re-render

let testSequence = []

// Monitor all events
window.addEventListener('NAV_START', (event) => {
  testSequence.push({
    event: 'NAV_START',
    timestamp: Date.now(),
    detail: event.detail
  })
  console.log(`🎯 [FINAL_TEST] 🚀 NAV_START: ${event.detail.from} → ${event.detail.to}`)
})

window.addEventListener('NAV_COMPLETE', (event) => {
  testSequence.push({
    event: 'NAV_COMPLETE',
    timestamp: Date.now(),
    detail: event.detail
  })
  console.log(`🎯 [FINAL_TEST] 🎯 NAV_COMPLETE: ${event.detail.from} → ${event.detail.to}`)
})

// Monitor layout re-renders
const layoutObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for new app container
          if (node.classList.contains('app')) {
            testSequence.push({
              event: 'LAYOUT_RE_RENDER',
              timestamp: Date.now()
            })
            console.log(`🎯 [FINAL_TEST] 🔄 Layout re-render detected`)
          }
          
          // Look for content changes
          const content = node.textContent || ''
          if (content.includes('Profile') && content.includes('User Stats')) {
            testSequence.push({
              event: 'CONTENT_PROFILE',
              timestamp: Date.now()
            })
            console.log(`🎯 [FINAL_TEST] 📄 Profile content detected`)
          }
          
          if (content.includes('Village') && content.includes('Community')) {
            testSequence.push({
              event: 'CONTENT_VILLAGE',
              timestamp: Date.now()
            })
            console.log(`🎯 [FINAL_TEST] 📄 Village content detected`)
          }
        }
      })
    }
  })
})

layoutObserver.observe(document.body, {
  childList: true,
  subtree: true
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
          testSequence.push({
            event: 'TAB_ACTIVE',
            timestamp: Date.now(),
            tab: tabText
          })
          console.log(`🎯 [FINAL_TEST] 📌 Active tab: ${tabText}`)
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

// Test navigation sequence
setTimeout(() => {
  console.log('🎯 [FINAL_TEST] === STARTING NAVIGATION TEST ===')
  
  // Find Profile button
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🎯 [FINAL_TEST] Clicking Profile button...')
    profileBtn.click()
  } else {
    console.log('🎯 [FINAL_TEST] Profile button not found')
  }
}, 2000)

// Analyze results after 6 seconds
setTimeout(() => {
  console.log('🎯 [FINAL_TEST] === TEST RESULTS ===')
  
  // Check sequence order
  const navStart = testSequence.find(s => s.event === 'NAV_START')
  const navComplete = testSequence.find(s => s.event === 'NAV_COMPLETE')
  const layoutReRender = testSequence.find(s => s.event === 'LAYOUT_RE_RENDER')
  const contentProfile = testSequence.find(s => s.event === 'CONTENT_PROFILE')
  const activeTab = testSequence.find(s => s.event === 'TAB_ACTIVE')
  
  console.log(`🎯 [FINAL_TEST] NAV_START: ${navStart ? '✅' : '❌'}`)
  console.log(`🎯 [FINAL_TEST] NAV_COMPLETE: ${navComplete ? '✅' : '❌'}`)
  console.log(`🎯 [FINAL_TEST] Layout re-render: ${layoutReRender ? '✅' : '❌'}`)
  console.log(`🎯 [FINAL_TEST] Profile content: ${contentProfile ? '✅' : '❌'}`)
  console.log(`🎯 [FINAL_TEST] Active tab: ${activeTab ? activeTab.tab : '❌'}`)
  
  // Check timing sequence
  if (navStart && navComplete) {
    const timing = navComplete.timestamp - navStart.timestamp
    console.log(`🎯 [FINAL_TEST] Navigation timing: ${timing}ms`)
    
    if (timing > 0 && timing < 200) {
      console.log('🎯 [FINAL_TEST] ✅ Navigation timing correct')
    } else {
      console.log('🎯 [FINAL_TEST] ❌ Navigation timing unexpected')
    }
  }
  
  // Check synchronization
  if (activeTab && contentProfile) {
    if (activeTab.tab.includes('Profile')) {
      console.log('🎯 [FINAL_TEST] ✅ Header and content synchronized!')
    } else {
      console.log(`🎯 [FINAL_TEST] ❌ Header shows "${activeTab.tab}" but content shows Profile`)
    }
  }
  
  // Show full sequence
  console.log('🎯 [FINAL_TEST] Full event sequence:')
  testSequence.forEach((event, index) => {
    const time = event.timestamp - testSequence[0].timestamp
    const detail = event.detail ? ` (${event.detail.from} → ${event.detail.to})` : ''
    const tab = event.tab ? ` [${event.tab}]` : ''
    console.log(`🎯 [FINAL_TEST]   ${index + 1}. ${event.event}${detail}${tab} at +${time}ms`)
  })
  
  // Cleanup
  layoutObserver.disconnect()
  headerObserver.disconnect()
  
  console.log('🎯 [FINAL_TEST] Final test complete')
}, 6000)
