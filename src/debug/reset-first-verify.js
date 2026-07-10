// Reset-First CSS Pattern Verification
console.log('🔄 [RESET_FIRST_VERIFY] Starting Reset-First CSS pattern verification')

// Test the reset-first implementation
function testResetFirstPattern() {
  console.log('🔄 [RESET_FIRST_VERIFY] === RESET-FIRST PATTERN TEST ===')
  
  // Get all nav links
  const navLinks = document.querySelectorAll('.header__nav-link')
  console.log(`🔄 [RESET_FIRST_VERIFY] Found ${navLinks.length} navigation links`)
  
  // Check current header attribute
  const header = document.querySelector('header.header')
  const activePage = header?.getAttribute('data-active-page')
  console.log(`🔄 [RESET_FIRST_VERIFY] Header data-active-page: "${activePage}"`)
  
  // Count active vs inactive links
  let activeCount = 0
  let inactiveCount = 0
  let activeLinkText = ''
  
  navLinks.forEach((link, index) => {
    const navPage = link.getAttribute('data-nav-page')
    const text = link.textContent?.trim()
    const computedStyle = window.getComputedStyle(link)
    
    // Check if link has active styling
    const hasActiveBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedStyle.backgroundColor !== 'transparent'
    const hasActiveBoxShadow = computedStyle.boxShadow !== 'none'
    const hasActiveFontWeight = computedStyle.fontWeight === '600' || computedStyle.fontWeight === '700'
    
    const isActive = hasActiveBackground && hasActiveBoxShadow && hasActiveFontWeight
    
    if (isActive) {
      activeCount++
      activeLinkText = text
      console.log(`🔄 [RESET_FIRST_VERIFY] ✅ ACTIVE: "${text}" (data-nav-page="${navPage}")`)
      console.log(`🔄 [RESET_FIRST_VERIFY]   Background: ${computedStyle.backgroundColor}`)
      console.log(`🔄 [RESET_FIRST_VERIFY]   Box shadow: ${computedStyle.boxShadow}`)
      console.log(`🔄 [RESET_FIRST_VERIFY]   Font weight: ${computedStyle.fontWeight}`)
    } else {
      inactiveCount++
      console.log(`🔄 [RESET_FIRST_VERIFY] ❌ INACTIVE: "${text}" (data-nav-page="${navPage}")`)
      console.log(`🔄 [RESET_FIRST_VERIFY]   Background: ${computedStyle.backgroundColor}`)
      console.log(`🔄 [RESET_FIRST_VERIFY]   Box shadow: ${computedStyle.boxShadow}`)
    }
  })
  
  console.log(`🔄 [RESET_FIRST_VERIFY] Summary:`)
  console.log(`🔄 [RESET_FIRST_VERIFY]   Active links: ${activeCount}`)
  console.log(`🔄 [RESET_FIRST_VERIFY]   Inactive links: ${inactiveCount}`)
  console.log(`🔄 [RESET_FIRST_VERIFY]   Expected active: "${activePage}"`)
  console.log(`🔄 [RESET_FIRST_VERIFY]   Actual active: "${activeLinkText}"`)
  
  // Verify reset-first is working
  const isWorking = activeCount === 1 && activeLinkText.toLowerCase().includes(activePage || '')
  
  if (isWorking) {
    console.log(`🔄 [RESET_FIRST_VERIFY] ✅ SUCCESS: Reset-First pattern working!`)
    console.log(`🔄 [RESET_FIRST_VERIFY] ✅ Only one tab active and matches header attribute`)
  } else {
    console.log(`🔄 [RESET_FIRST_VERIFY] ❌ FAILURE: Reset-First pattern not working`)
    if (activeCount === 0) {
      console.log(`🔄 [RESET_FIRST_VERIFY] ❌ No active tabs found`)
    } else if (activeCount > 1) {
      console.log(`🔄 [RESET_FIRST_VERIFY] ❌ Multiple tabs active (${activeCount}) - "All Lit Up" issue persists`)
    }
    if (!activeLinkText.toLowerCase().includes(activePage || '')) {
      console.log(`🔄 [RESET_FIRST_VERIFY] ❌ Active tab doesn't match header attribute`)
    }
  }
  
  return isWorking
}

// Test navigation and reset
function testNavigationAndReset() {
  console.log('🔄 [RESET_FIRST_VERIFY] Testing navigation and reset...')
  
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🔄 [RESET_FIRST_VERIFY] Clicking Profile button...')
    profileBtn.click()
    
    // Wait for DOM updates
    setTimeout(() => {
      console.log('🔄 [RESET_FIRST_VERIFY] Checking reset after navigation...')
      const success = testResetFirstPattern()
      
      if (success) {
        console.log('🔄 [RESET_FIRST_VERIFY] ✅ Navigation reset test PASSED')
      } else {
        console.log('🔄 [RESET_FIRST_VERIFY] ❌ Navigation reset test FAILED')
      }
    }, 500)
  } else {
    console.log('🔄 [RESET_FIRST_VERIFY] Profile button not found')
  }
}

// Run verification
setTimeout(() => {
  console.log('🔄 [RESET_FIRST_VERIFY] === STARTING RESET-FIRST VERIFICATION ===')
  
  // Test current state
  testResetFirstPattern()
  
  // Test navigation
  setTimeout(() => {
    testNavigationAndReset()
  }, 2000)
  
  // Final test
  setTimeout(() => {
    console.log('🔄 [RESET_FIRST_VERIFY] === FINAL VERIFICATION ===')
    const finalResult = testResetFirstPattern()
    
    console.log(`🔄 [RESET_FIRST_VERIFY] Reset-First CSS Pattern: ${finalResult ? '✅ WORKING' : '❌ BROKEN'}`)
    console.log('🔄 [RESET_FIRST_VERIFY] Verification complete')
  }, 4000)
}, 1000)
