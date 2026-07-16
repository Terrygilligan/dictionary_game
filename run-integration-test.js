// Simple Node.js runner for the integration test
const { runIntegrationTest } = require('./src/services/integration-test.ts');

console.log('🔧 [SETUP] Starting integration test runner...\n');

// Run the integration test
runIntegrationTest()
  .then(() => {
    console.log('\n✅ [RUNNER] Integration test completed successfully');
  })
  .catch((error) => {
    console.error('\n❌ [RUNNER] Integration test failed:', error);
    process.exit(1);
  });
