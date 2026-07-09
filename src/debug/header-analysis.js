// Header Component Analysis - Targeted Diagnosis
console.log('🎯 [HEADER_ANALYSIS] Starting targeted header component analysis')

// Track NavigationContext currentPage state
let currentPageState = null
let headerCurrentPage = null
let navigationTiming = []

// Monitor NavigationContext state changes
let navContextCheckInterval = setInterval(() => {
  // Try to access navigation state through React DevTools or global hooks
  const appElement = document.querySelector('#root')
  if (appElement) {
    // Look for React component instances
    const reactRoot = appElement._reactRootContainer?._internalRoot?.current
    if (reactRoot) {
      // Try to find NavigationContext value
      const findNavigationContext = (node) => {
        if (node && node.child) {
          // Check if this node has navigation context
          if (node.memoizedProps && node.memoizedProps.value && node.memoizedProps.value.currentPage) {
            return node.memoizedProps.value.currentPage
          }
          return findNavigationContext(node.child)
        }
        return null
      }
      
      const newPage = findNavigationContext(reactRoot)
      if (newPage !== currentPageState) {
        if (currentPageState !== null) {
          navigationTiming.push({
            from: currentPageState,
            to: newPage,
            timestamp: Date.now()
          })
          console.log(`🎯 [HEADER_ANALYSIS] NavigationContext: ${currentPageState} → ${newPage}`)
        }
        currentPageState = newPage
      }
    }
  }
}, 100)

// Monitor Header component's active tab state
const headerObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const target = mutation.target
      if (target.classList.contains('header__nav-link')) {
        const isActive = target.classList.contains('header__nav-link--active')
        const tabText = target.textContent?.trim()
        
        if (isActive) {
          const previousHeaderPage = headerCurrentPage
          headerCurrentPage = tabText
          
          if (previousHeaderPage && previousHeaderPage !== tabText) {
            console.log(`🎯 [HEADER_ANALYSIS] Header active tab: ${previousHeaderPage} → ${tabText}`)
            
            // Check for mismatch
            if (currentPageState && tabText.toLowerCase() !== currentPageState.toLowerCase()) {
              console.error(`🎯 [HEADER_ANALYSIS] ❌ MISMATCH DETECTED!`)
              console.error(`🎯 [HEADER_ANALYSIS] NavigationContext: ${currentPageState}`)
              console.error(`🎯 [HEADER_ANALYSIS] Header active tab: ${tabText}`)
              console.error(`🎯 [HEADER_ANALYSIS] Timestamp: ${Date.now()}`)
            }
          }
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

// Monitor page content changes
const contentObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for specific page content
          const pageText = node.textContent || ''
          
          // Profile page indicators
          if (pageText.includes('Profile') && pageText.includes('User Stats')) {
            console.log(`🎯 [HEADER_ANALYSIS] Content: Profile page detected`)
            if (headerCurrentPage && headerCurrentPage !== 'Profile') {
              console.error(`🎯 [HEADER_ANALYSIS] ❌ CONTENT-HEADER MISMATCH!`)
              console.error(`🎯 [HEADER_ANALYSIS] Content shows: Profile`)
              console.error(`🎯 [HEADER_ANALYSIS] Header shows: ${headerCurrentPage}`)
            }
          }
          
          // Village page indicators
          if (pageText.includes('Village') && pageText.includes('Community')) {
            console.log(`🎯 [HEADER_ANALYSIS] Content: Village page detected`)
            if (headerCurrentPage && headerCurrentPage !== 'Village') {
              console.error(`🎯 [HEADER_ANALYSIS] ❌ CONTENT-HEADER MISMATCH!`)
              console.error(`🎯 [HEADER_ANALYSIS] Content shows: Village`)
              console.error(`🎯 [HEADER_ANALYSIS] Header shows: ${headerCurrentPage}`)
            }
          }
        }
      })
    }
  })
})

contentObserver.observe(document.body, {
  childList: true,
  subtree: true
})

// Trigger navigation test after 3 seconds
setTimeout(() => {
  console.log('🎯 [HEADER_ANALYSIS] Triggering navigation test...')
  
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🎯 [HEADER_ANALYSIS] Clicking Profile button')
    profileBtn.click()
  } else {
    console.log('🎯 [HEADER_ANALYSIS] Profile button not found, trying village')
    const villageBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Village'))
    if (villageBtn) {
      villageBtn.click()
    }
  }
}, 3000)

// Final report after 8 seconds
setTimeout(() => {
  console.log('🎯 [HEADER_ANALYSIS] === FINAL ANALYSIS ===')
  console.log(`🎯 [HEADER_ANALYSIS] NavigationContext state: ${currentPageState}`)
  console.log(`🎯 [HEADER_ANALYSIS] Header active tab: ${headerCurrentPage}`)
  console.log(`🎯 [HEADER_ANALYSIS] Navigation timing events: ${navigationTiming.length}`)
  
  if (navigationTiming.length > 0) {
    console.log('🎯 [HEADER_ANALYSIS] Navigation sequence:')
    navigationTiming.forEach((event, index) => {
      console.log(`🎯 [HEADER_ANALYSIS]   ${index + 1}. ${event.from} → ${event.to} at ${event.timestamp}`)
    })
  }
  
  // Cleanup
  clearInterval(navContextCheckInterval)
  headerObserver.disconnect()
  contentObserver.disconnect()
  
  console.log('🎯 [HEADER_ANALYSIS] Analysis complete')
}, 8000)
