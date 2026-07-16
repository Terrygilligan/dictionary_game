// CSS Class Verification - Test header__nav-link--active styling
console.log('🎨 [CSS_VERIFY] Starting CSS class verification')

// Test if header__nav-link--active class exists and has styling
function testActiveClassStyling() {
  const activeElement = document.createElement('div')
  activeElement.className = 'header__nav-link header__nav-link--active'
  document.body.appendChild(activeElement)
  
  const computedStyle = window.getComputedStyle(activeElement)
  const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && computedStyle.backgroundColor !== 'transparent'
  const hasBoxShadow = computedStyle.boxShadow !== 'none'
  const fontWeight = computedStyle.fontWeight
  
  console.log(`🎨 [CSS_VERIFY] Active class styling test:`)
  console.log(`🎨 [CSS_VERIFY]   Background: ${hasBackground ? '✅' : '❌'} (${computedStyle.backgroundColor})`)
  console.log(`🎨 [CSS_VERIFY]   Box shadow: ${hasBoxShadow ? '✅' : '❌'} (${computedStyle.boxShadow})`)
  console.log(`🎨 [CSS_VERIFY]   Font weight: ${fontWeight}`)
  
  document.body.removeChild(activeElement)
  
  return hasBackground || hasBoxShadow
}

// Monitor header tab states
function monitorHeaderTabs() {
  const headerLinks = document.querySelectorAll('.header__nav-link')
  console.log(`🎨 [CSS_VERIFY] Found ${headerLinks.length} header navigation links`)
  
  headerLinks.forEach((link, index) => {
    const isActive = link.classList.contains('header__nav-link--active')
    const isPrimary = link.classList.contains('header__nav-link--primary')
    const text = link.textContent?.trim()
    const dataNavPage = link.getAttribute('data-nav-page')
    
    console.log(`🎨 [CSS_VERIFY] Tab ${index + 1}: "${text}"`)
    console.log(`🎨 [CSS_VERIFY]   data-nav-page: ${dataNavPage}`)
    console.log(`🎨 [CSS_VERIFY]   active: ${isActive}`)
    console.log(`🎨 [CSS_VERIFY]   primary: ${isPrimary}`)
    
    if (isActive) {
      const computedStyle = window.getComputedStyle(link)
      console.log(`🎨 [CSS_VERIFY]   Active styling:`)
      console.log(`🎨 [CSS_VERIFY]     Background: ${computedStyle.backgroundColor}`)
      console.log(`🎨 [CSS_VERIFY]     Box shadow: ${computedStyle.boxShadow}`)
      console.log(`🎨 [CSS_VERIFY]     Font weight: ${computedStyle.fontWeight}`)
    }
  })
}

// Test navigation and CSS class application
function testNavigationAndStyling() {
  console.log('🎨 [CSS_VERIFY] Testing navigation and CSS class application...')
  
  const buttons = document.querySelectorAll('button')
  const profileBtn = Array.from(buttons).find(btn => btn.textContent?.includes('Profile'))
  
  if (profileBtn) {
    console.log('🎨 [CSS_VERIFY] Clicking Profile button...')
    profileBtn.click()
    
    // Wait a moment for DOM updates
    setTimeout(() => {
      console.log('🎨 [CSS_VERIFY] Checking Profile tab styling after navigation...')
      monitorHeaderTabs()
    }, 500)
  } else {
    console.log('🎨 [CSS_VERIFY] Profile button not found')
  }
}

// Run verification tests
setTimeout(() => {
  console.log('🎨 [CSS_VERIFY] === STARTING CSS VERIFICATION ===')
  
  // Test 1: Check if active class has styling
  const hasActiveStyling = testActiveClassStyling()
  console.log(`🎨 [CSS_VERIFY] Active class has styling: ${hasActiveStyling ? '✅' : '❌'}`)
  
  // Test 2: Monitor current header state
  monitorHeaderTabs()
  
  // Test 3: Test navigation and styling
  setTimeout(() => {
    testNavigationAndStyling()
  }, 2000)
  
  // Final check after navigation
  setTimeout(() => {
    console.log('🎨 [CSS_VERIFY] === FINAL VERIFICATION ===')
    monitorHeaderTabs()
    
    const activeLinks = document.querySelectorAll('.header__nav-link--active')
    console.log(`🎨 [CSS_VERIFY] Final active links count: ${activeLinks.length}`)
    
    if (activeLinks.length > 0) {
      const activeLink = activeLinks[0]
      const computedStyle = window.getComputedStyle(activeLink)
      const hasVisualStyling = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || computedStyle.boxShadow !== 'none'
      
      console.log(`🎨 [CSS_VERIFY] Visual styling applied: ${hasVisualStyling ? '✅' : '❌'}`)
      console.log(`🎨 [CSS_VERIFY] Active tab: "${activeLink.textContent?.trim()}"`)
    }
    
    console.log('🎨 [CSS_VERIFY] CSS verification complete')
  }, 5000)
}, 1000)
