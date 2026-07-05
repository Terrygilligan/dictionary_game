import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { testBackend } from '@/utils/backendTest'

interface TestResult {
  test: string
  success: boolean
  message: string
  details?: any
}

export function BackendTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runTest = async () => {
    setIsRunning(true)
    setResults([])
    
    try {
      const diagnostic = await testBackend()
      setResults(diagnostic.results)
    } catch (error) {
      setResults([{
        test: 'Diagnostic Error',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="panel">
      <h2>🔍 Backend Connection Tester</h2>
      <p>Test Firebase connectivity and service availability</p>
      
      <Button onClick={runTest} disabled={isRunning}>
        {isRunning ? 'Testing...' : 'Run Backend Test'}
      </Button>
      
      {results.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Test Results:</h3>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '0.5rem',
                margin: '0.5rem 0',
                borderRadius: '0.25rem',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`
              }}
            >
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{result.success ? '✅' : '❌'}</span>
                <span>{result.test}</span>
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                {result.message}
              </div>
              {result.details && (
                <details style={{ marginTop: '0.5rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7 }}>
                    Show Details
                  </summary>
                  <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
        <p>This tool tests:</p>
        <ul>
          <li>Firebase Auth connection</li>
          <li>Firebase Firestore connection</li>
          <li>Service availability</li>
          <li>Encryption functionality</li>
        </ul>
      </div>
    </div>
  )
}
