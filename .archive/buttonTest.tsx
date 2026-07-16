/**
 * Button Test Script - Comprehensive Diagnostic Tool
 * 
 * This script tests all button click handlers and provides detailed logging
 * to identify exactly what's failing in the button click chain.
 */

import React from 'react'

// Test function to add to any button component
export const addClickTest = (buttonName: string, originalHandler?: () => void) => {
  console.log(`🧪 [BUTTON TEST] Adding test to: ${buttonName}`)
  
  return (e: React.MouseEvent) => {
    console.log(`🔘 [CLICK] ${buttonName} clicked!`)
    console.log(`📍 [EVENT] Event details:`, {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      timeStamp: e.timeStamp,
      isTrusted: e.isTrusted,
      bubbles: e.bubbles,
      cancelable: e.cancelable
    })
    
    // Check if element is actually clickable
    const element = e.currentTarget as HTMLElement
    const computedStyle = window.getComputedStyle(element)
    
    console.log(`🎨 [STYLE] Computed styles:`, {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      pointerEvents: computedStyle.pointerEvents,
      opacity: computedStyle.opacity,
      zIndex: computedStyle.zIndex,
      position: computedStyle.position
    })
    
    // Check bounding box
    const rect = element.getBoundingClientRect()
    console.log(`📐 [GEOMETRY] Element bounds:`, {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      isVisible: rect.width > 0 && rect.height > 0
    })
    
    // Check for overlays
    const elementsAtPoint = document.elementsFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    )
    console.log(`🔍 [OVERLAY] Elements at click point:`, elementsAtPoint.map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      zIndex: window.getComputedStyle(el).zIndex,
      pointerEvents: window.getComputedStyle(el).pointerEvents
    })))
    
    // Call original handler if it exists
    if (originalHandler) {
      try {
        console.log(`⚡ [HANDLER] Calling original handler for ${buttonName}`)
        originalHandler()
        console.log(`✅ [HANDLER] Original handler completed for ${buttonName}`)
      } catch (error) {
        console.error(`❌ [HANDLER] Original handler failed for ${buttonName}:`, error)
      }
    } else {
      console.log(`⚠️ [HANDLER] No original handler found for ${buttonName}`)
    }
  }
}

// Test all navigation functions
export const testNavigation = () => {
  console.log(`🧭 [NAV TEST] Testing navigation functions...`)
  
  // Test if navigation context is available
  try {
    const { useNavigation } = require('@/shared/lib/navigation')
    const nav = useNavigation()
    console.log(`✅ [NAV TEST] Navigation context available:`, {
      currentPage: nav.currentPage,
      navigate: typeof nav.navigate
    })
    
    // Test navigate function
    const testNavigate = (page: string) => {
      console.log(`🧭 [NAV TEST] Attempting to navigate to: ${page}`)
      try {
        nav.navigate(page as any)
        console.log(`✅ [NAV TEST] Navigation to ${page} succeeded`)
      } catch (error) {
        console.error(`❌ [NAV TEST] Navigation to ${page} failed:`, error)
      }
    }
    
    return testNavigate
  } catch (error) {
    console.error(`❌ [NAV TEST] Navigation context not available:`, error)
    return () => console.log(`❌ [NAV TEST] Navigation not available`)
  }
}

// Test DOM structure
export const testDOMStructure = () => {
  console.log(`🏗️ [DOM TEST] Analyzing DOM structure...`)
  
  // Find all buttons
  const buttons = document.querySelectorAll('button')
  console.log(`🔘 [DOM TEST] Found ${buttons.length} buttons:`, Array.from(buttons).map((btn, index) => ({
    index,
    textContent: btn.textContent?.trim(),
    className: btn.className,
    id: btn.id,
    disabled: btn.disabled,
    onClick: btn.onclick ? 'has onclick' : 'no onclick',
    bounds: btn.getBoundingClientRect()
  })))
  
  // Check for overlays
  const headers = document.querySelectorAll('header')
  console.log(`📋 [DOM TEST] Found ${headers.length} headers:`, Array.from(headers).map(header => ({
    className: header.className,
    computedStyle: {
      position: window.getComputedStyle(header).position,
      zIndex: window.getComputedStyle(header).zIndex,
      pointerEvents: window.getComputedStyle(header).pointerEvents
    },
    bounds: header.getBoundingClientRect()
  })))
  
  // Check main content area
  const mains = document.querySelectorAll('main')
  console.log(`📄 [DOM TEST] Found ${mains.length} main elements:`, Array.from(mains).map(main => ({
    className: main.className,
    bounds: main.getBoundingClientRect()
  })))
}

// Test CSS issues
export const testCSSIssues = () => {
  console.log(`🎨 [CSS TEST] Checking for CSS issues...`)
  
  // Check for problematic z-index values
  const allElements = document.querySelectorAll('*')
  const highZIndexElements = Array.from(allElements).filter(el => {
    const zIndex = parseInt(window.getComputedStyle(el).zIndex)
    return zIndex > 10
  })
  
  console.log(`🔺 [CSS TEST] Elements with high z-index:`, highZIndexElements.map(el => ({
    tagName: el.tagName,
    className: el.className,
    zIndex: window.getComputedStyle(el).zIndex,
    position: window.getComputedStyle(el).position,
    pointerEvents: window.getComputedStyle(el).pointerEvents
  })))
  
  // Check for pointer-events: none on interactive elements
  const disabledPointerEvents = Array.from(allElements).filter(el => {
    const style = window.getComputedStyle(el)
    const isInteractive = el.tagName === 'BUTTON' || el.tagName === 'A' || el.onclick
    return isInteractive && style.pointerEvents === 'none'
  })
  
  console.log(`🚫 [CSS TEST] Interactive elements with disabled pointer events:`, disabledPointerEvents.map(el => ({
    tagName: el.tagName,
    className: el.className,
    pointerEvents: window.getComputedStyle(el).pointerEvents
  })))
}

// Global test function - call this from browser console
export const runFullButtonTest = () => {
  console.log(`🚀 [FULL TEST] Starting comprehensive button test...`)
  
  testDOMStructure()
  testCSSIssues()
  
  // Add click listeners to all buttons
  const buttons = document.querySelectorAll('button')
  buttons.forEach((button, index) => {
    const buttonName = button.textContent?.trim() || `Button ${index}`
    const originalHandler = button.onclick
    
    button.addEventListener('click', addClickTest(buttonName, originalHandler || undefined))
    console.log(`🔘 [FULL TEST] Added test listener to: ${buttonName}`)
  })
  
  console.log(`✅ [FULL TEST] Test complete! Click any button to see detailed diagnostics.`)
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).runFullButtonTest = runFullButtonTest
  (window as any).testDOMStructure = testDOMStructure
  (window as any).testCSSIssues = testCSSIssues
  console.log(`🧪 [TEST] Button test functions available in console:
    - runFullButtonTest() - Test all buttons
    - testDOMStructure() - Analyze DOM structure  
    - testCSSIssues() - Check CSS problems`)
}
