import { runIntegrationTest } from './integration-test'

// Execute the integration test and capture all logs
console.log('🚀 [RUNNER] Starting end-to-end integration test...\n')

runIntegrationTest()
  .then(() => {
    console.log('\n🎉 [RUNNER] Integration test execution completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 [RUNNER] Integration test execution failed:', error)
    process.exit(1)
  })
