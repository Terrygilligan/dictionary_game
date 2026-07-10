// CSS-Attribute Truth Verification
console.log('🎨 [CSS_ATTR_VERIFY] Starting CSS-Attribute Truth verification')

// Test the CSS-Attribute implementation
function testCssAttributeTruth() {
  console.log('🎨 [CSS_ATTR_VERIFY] === CSS-ATTRIBUTE TRUTH TEST ===')
  
  // Check header data attribute
  const header = document.querySelector('header.header')
  if (header) {
    const activePage = header.getAttribute('data-active-page')
    console.log(`🎨 [CSS_ATTR_VERIFY] Header data-active-page: "${activePage}"`)
  }
  
  // Check all nav links have data-nav-page attributes
  const navLinks = document.querySelectorAll('.header__nav-link')
  console.log(`🎨 [CSS_ATTR_VERIFY] Found ${navLinks.length} navigation links`)
  
  navLinks.forEach((link, index) => {
    const navPage = link.getAttribute('data-nav-page')
    const text = link.textContent?.trim()
    const computedStyle = window.getComputedStyle(link)
    
    console.log(`🎨 [CSS_ATTR_VERIFY] Link ${index + 1}: "${text}"`)
    console.log(`🎨 [CSS_ATTR_VERIFY]   data-nav-page: "${navPage}"`)
    console.log(`🎨 [CSS_ATTR_VERIFY]   Background: ${computedStyle.backgroundColor}`)
    console.log(`🎨 [CSS_ATTR_VERIFY]   Box shadow: ${computedStyle.boxShadow}`)
    console.log(`🎨 [CSS_ATTR_VERIFY]   Font weight: ${computedStyle.fontWeight}`)
    
    // Check if this link should be active based on header attribute
    const header = document.querySelector('header.header')
    const activePage = header?.getAttribute('data-active-page')
    const shouldBeActive = navPage === activePage
    
    if (shouldBeActive) {
      const hasActiveStyling = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                               computedStyle.backgroundColor !== 'transparent'
      console.log(`🎨 [CSS_ATTR_VERIFY]   Should be active: ${shouldBeActive ? '✅' : '❌'}`)
      console.log(`🎨 [CSS_ATTR_VERIFY]   Has active styling: ${hasActiveStyling ? '✅' : '❌'}`)
      
      if (hasActiveStyling) {
        console.log(`🎨 [CSS_ATTR_VERIFY]   ✅ CSS-Attribute Truth working!`)
      } else {
        console.log(`🎨 [CSS_ATTR_VERIFY]   ❌ CSS-Attribute Truth failed - no visual styling`)
      }
    }
  })
}

// Test navigation and attribute updates
function testNavigationAndAttributes() {
  console.log('🎨 [CSS_ATTR_VERIFY] Testing navigation and attribute updates...')
  
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🎨 [CSS_ATTR_VERIFY] Clicking Profile button...')
    profileBtn.click()
    
    // Wait for DOM updates
    setTimeout(() => {
      console.log('🎨 [CSS_ATTR_VERIFY] Checking attributes after navigation...')
      testCssAttributeTruth()
    }, 500)
  } else {
    console.log('🎨 [CSS_ATTR_VERIFY] Profile button not found')
  }
}

// Test simultaneous active states (should be impossible)
function testNoDoubleActive() {
  console.log('🎨 [CSS_ATTR_VERIFY] Testing for double active states...')
  
  const navLinks = document.querySelectorAll('.header__nav-link')
  let activeCount = 0
  
  navLinks.forEach(link => {
    const computedStyle = window.getComputedStyle(link)
    const hasActiveStyling = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                             computedStyle.backgroundColor !== 'transparent'
    if (hasActiveStyling) {
      activeCount++
      console.log(`🎨 [CSS_ATTR_VERIFY] Active link found: "${link.textContent?.trim()}"`)
    }
  })
  
  console.log(`🎨 [CSS_ATTR_VERIFY] Total active links: ${activeCount}`)
  
  if (activeCount === 1) {
    console.log(`🎨 [CSS_ATTR_VERIFY] ✅ SUCCESS: Only one active link`)
  } else if (activeCount === 0) {
    console.log(`🎨 [CSS_ATTR_VERIFY] ⚠️  WARNING: No active links found`)
  } else {
    console.log(`🎨 [CSS_ATTR_VERIFY] ❌ FAILURE: Multiple active links (${activeCount})`)
  }
  
  return activeCount === 1
}

// Run verification tests
setTimeout(() => {
  console.log('🎨 [CSS_ATTR_VERIFY] === STARTING CSS-ATTRIBUTE VERIFICATION ===')
  
  // Test 1: Current state
  testCssAttributeTruth()
  
  // Test 2: No double active
  setTimeout(() => {
    const noDoubleActive = testNoDoubleActive()
    console.log(`🎨 [CSS_ATTR_VERIFY] No double active test: ${noDoubleActive ? '✅' : '❌'}`)
  }, 1000)
  
  // Test 3: Navigation and attributes
  setTimeout(() => {
    testNavigationAndAttributes()
  }, 2000)
  
  // Final verification
  setTimeout(() => {
    console.log('🎨 [CSS_ATTR_VERIFY] === FINAL VERIFICATION ===')
    testCssAttributeTruth()
    const finalResult = testNoDoubleActive()
    
    console.log(`🎨 [CSS_ATTR_VERIFY] CSS-Attribute Truth implementation: ${finalResult ? '✅ SUCCESS' : '❌ FAILURE'}`)
    console.log('🎨 [CSS_ATTR_VERIFY] Verification complete')
  }, 4000)
}, 1000)
