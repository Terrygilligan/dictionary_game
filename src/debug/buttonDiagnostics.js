/**
 * Button Diagnostics - Simple JavaScript Test Script
 * Add this to your main app to debug button issues
 */

// Global test function
window.runButtonDiagnostics = function() {
  console.log('🚀 [BUTTON DIAGNOSTICS] Starting comprehensive button test...');
  
  // Test 1: Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log(`🔘 [TEST 1] Found ${buttons.length} buttons:`, 
    Array.from(buttons).map((btn, i) => ({
      index: i,
      text: btn.textContent?.trim(),
      className: btn.className,
      id: btn.id,
      disabled: btn.disabled,
      bounds: btn.getBoundingClientRect()
    }))
  );
  
  // Test 2: Check for overlays
  console.log('🔍 [TEST 2] Checking for overlays...');
  buttons.forEach((btn, i) => {
    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    if (rect.width > 0 && rect.height > 0) {
      const elementsAtPoint = document.elementsFromPoint(centerX, centerY);
      console.log(`🔍 [OVERLAY ${i}] Elements at button "${btn.textContent?.trim()}":`, 
        elementsAtPoint.map(el => ({
          tag: el.tagName,
          class: el.className,
          zIndex: window.getComputedStyle(el).zIndex,
          pointerEvents: window.getComputedStyle(el).pointerEvents
        }))
      );
    }
  });
  
  // Test 3: Check header issues
  const headers = document.querySelectorAll('header');
  console.log(`📋 [TEST 3] Found ${headers.length} headers:`, 
    Array.from(headers).map(header => ({
      class: header.className,
      style: {
        position: window.getComputedStyle(header).position,
        zIndex: window.getComputedStyle(header).zIndex,
        pointerEvents: window.getComputedStyle(header).pointerEvents
      },
      bounds: header.getBoundingClientRect()
    }))
  );
  
  // Test 4: Add click listeners to all buttons
  console.log('👂 [TEST 4] Adding click listeners to all buttons...');
  buttons.forEach((btn, i) => {
    const originalOnClick = btn.onclick;
    const buttonText = btn.textContent?.trim() || `Button ${i}`;
    
    btn.addEventListener('click', function(e) {
      console.log(`🔘 [CLICK] ${buttonText} clicked!`);
      console.log(`📍 [EVENT] Event details:`, {
        type: e.type,
        target: e.target,
        currentTarget: e.currentTarget,
        isTrusted: e.isTrusted,
        bubbles: e.bubbles
      });
      
      // Check element styles
      const computedStyle = window.getComputedStyle(this);
      console.log(`🎨 [STYLE] Button styles:`, {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        pointerEvents: computedStyle.pointerEvents,
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex
      });
      
      // Test original handler
      if (originalOnClick) {
        console.log(`⚡ [ORIGINAL] Calling original handler...`);
        try {
          originalOnClick.call(this, e);
          console.log(`✅ [ORIGINAL] Handler completed successfully`);
        } catch (error) {
          console.error(`❌ [ORIGINAL] Handler failed:`, error);
        }
      } else {
        console.log(`⚠️ [ORIGINAL] No original onclick handler found`);
      }
    });
    
    console.log(`👂 [LISTENER] Added test listener to: ${buttonText}`);
  });
  
  console.log('✅ [BUTTON DIAGNOSTICS] Test complete! Click any button to see detailed logs.');
};

// Test navigation specifically
window.testNavigation = function() {
  console.log('🧭 [NAV TEST] Testing navigation...');
  
  // Check if we can find navigation elements
  const navButtons = document.querySelectorAll('button[class*="nav"], button[class*="header"]');
  console.log(`🧭 [NAV TEST] Found ${navButtons.length} navigation buttons:`,
    Array.from(navButtons).map(btn => ({
      text: btn.textContent?.trim(),
      class: btn.className,
      hasOnClick: !!btn.onclick
    }))
  );
  
  // Test URL navigation
  console.log('🧭 [NAV TEST] Current URL:', window.location.href);
  console.log('🧭 [NAV TEST] Path:', window.location.pathname);
};

// Test DOM structure
window.testDOMStructure = function() {
  console.log('🏗️ [DOM TEST] Analyzing DOM structure...');
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main');
  const header = document.querySelector('header');
  
  console.log('🏗️ [DOM TEST] Key elements:', {
    app: app ? {
      class: app.className,
      bounds: app.getBoundingClientRect()
    } : 'NOT FOUND',
    main: main ? {
      class: main.className,
      bounds: main.getBoundingClientRect()
    } : 'NOT FOUND',
    header: header ? {
      class: header.className,
      bounds: header.getBoundingClientRect()
    } : 'NOT FOUND'
  });
};

// Auto-run on page load
console.log('🧪 [DIAGNOSTICS] Button test tools loaded. Run these commands in console:');
console.log('  - runButtonDiagnostics() - Test all buttons');
console.log('  - testNavigation() - Test navigation');
console.log('  - testDOMStructure() - Test DOM structure');

// Auto-run basic test
setTimeout(() => {
  console.log('🧪 [AUTO] Running automatic button test...');
  runButtonDiagnostics();
}, 1000);
