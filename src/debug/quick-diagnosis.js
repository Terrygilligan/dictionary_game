// Quick Header-Content Diagnosis
console.log('⚡ [QUICK_DIAG] Immediate header-content state check')

// Check current header state
const headerLinks = document.querySelectorAll('.header__nav-link')
console.log('⚡ [QUICK_DIAG] Header tabs found:', headerLinks.length)

headerLinks.forEach((link, index) => {
  const isActive = link.classList.contains('header__nav-link--active')
  const text = link.textContent?.trim()
  console.log(`⚡ [QUICK_DIAG] Tab ${index + 1}: "${text}" active=${isActive}`)
})

// Check current page content
const pageContent = document.querySelector('.page-container')
if (pageContent) {
  const contentText = pageContent.textContent?.substring(0, 100)
  console.log(`⚡ [QUICK_DIAG] Page content: "${contentText}..."`)
  
  // Identify current page
  if (contentText?.includes('Profile')) {
    console.log('⚡ [QUICK_DIAG] Content indicates: Profile page')
  } else if (contentText?.includes('Village')) {
    console.log('⚡ [QUICK_DIAG] Content indicates: Village page')
  } else if (contentText?.includes('Games')) {
    console.log('⚡ [QUICK_DIAG] Content indicates: Games page')
  } else if (contentText?.includes('Home') || contentText?.includes('Landing')) {
    console.log('⚡ [QUICK_DIAG] Content indicates: Landing page')
  }
}

// Check for any navigation state in React DevTools
const appRoot = document.querySelector('#root')
if (appRoot && appRoot._reactRootContainer) {
  console.log('⚡ [QUICK_DIAG] React root found')
  // Try to access current navigation state
  try {
    const internalRoot = appRoot._reactRootContainer._internalRoot
    if (internalRoot && internalRoot.current) {
      console.log('⚡ [QUICK_DIAG] React internal root accessible')
    }
  } catch (e) {
    console.log('⚡ [QUICK_DIAG] React internal root not accessible:', e.message)
  }
}

console.log('⚡ [QUICK_DIAG] Quick diagnosis complete')
