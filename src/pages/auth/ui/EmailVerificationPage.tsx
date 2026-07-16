import { useEffect, useState } from 'react'
import { useNavigation } from '@/shared/lib/navigation'
import { emailVerificationService } from '@/services/EmailVerificationService'
import { authService } from '@/services/auth'
import type { EmailVerificationJWTPayload } from '@/services/EmailVerificationService'

export function EmailVerificationPage() {
  const { navigate } = useNavigation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [userInfo, setUserInfo] = useState<EmailVerificationJWTPayload | null>(null)

  useEffect(() => {
    // Parse token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing')
      return
    }

    verifyEmail(token)
  }, [])

  const verifyEmail = async (token: string) => {
    try {
      console.log('🔍 [EMAIL_VERIFICATION_PAGE] Verifying email with token:', {
        tokenLength: token.length,
      })

      // Step 1: Verify JWT token
      const payload = emailVerificationService.verifyVerificationJWT(token)
      
      if (!payload) {
        setStatus('error')
        setMessage('Invalid verification token')
        return
      }

      console.log('✅ [EMAIL_VERIFICATION_PAGE] JWT verified successfully:', {
        correlationId: payload.correlationId,
        userId: payload.userId,
        email: payload.email,
      })

      setUserInfo(payload)

      // Step 2: Check current auth state
      const currentUser = authService.getCurrentUser()
      
      if (currentUser && currentUser.id === payload.userId) {
        // User is already logged in, check verification status
        const isVerified = authService.isEmailVerified()
        
        if (isVerified) {
          setStatus('success')
          setMessage('Your email has been successfully verified!')
          
          console.log('✅ [EMAIL_VERIFICATION_PAGE] Email already verified:', {
            correlationId: payload.correlationId,
            userId: payload.userId,
          })
        } else {
          setStatus('error')
          setMessage('Email verification is still pending. Please check your inbox.')
        }
      } else {
        // User is not logged in or different user
        setStatus('success')
        setMessage('Email verification successful! You can now sign in.')
        
        console.log('✅ [EMAIL_VERIFICATION_PAGE] Email verified for sign-in:', {
          correlationId: payload.correlationId,
          userId: payload.userId,
          email: payload.email,
        })
      }

    } catch (error) {
      console.error('❌ [EMAIL_VERIFICATION_PAGE] Verification failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      if (error instanceof Error && error.message.includes('expired')) {
        setStatus('expired')
        setMessage('Verification link has expired. Please request a new verification email.')
      } else {
        setStatus('error')
        setMessage('Email verification failed. Please try again or request a new verification email.')
      }
    }
  }

  const handleResendEmail = async () => {
    if (!userInfo) return

    try {
      setStatus('loading')
      setMessage('Resending verification email...')

      await emailVerificationService.resendVerificationEmail(
        userInfo.userId,
        userInfo.email,
        userInfo.correlationId
      )

      setStatus('success')
      setMessage('Verification email has been resent! Please check your inbox.')

    } catch (error) {
      console.error('❌ [EMAIL_VERIFICATION_PAGE] Resend failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      setStatus('error')
      setMessage('Failed to resend verification email. Please try again.')
    }
  }

  const handleSignIn = () => {
    // Navigate to sign in page
    navigate('auth')
  }

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {userInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {userInfo.email}<br />
                  <strong>User ID:</strong> {userInfo.userId}<br />
                  {userInfo.returnUrl && <><strong>Return URL:</strong> {userInfo.returnUrl}</>}
                </p>
              </div>
            )}

            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {userInfo && (
              <button
                onClick={handleResendEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-3"
              >
                Resend Verification Email
              </button>
            )}

            <button
              onClick={handleSignIn}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )

      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {userInfo && (
              <button
                onClick={handleResendEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-3"
              >
                Request New Verification Email
              </button>
            )}

            <button
              onClick={handleSignIn}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
          <p className="text-center text-sm text-gray-600">
            Lexicon Master Dictionary Game
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {renderContent()}
        </div>

        {userInfo && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Correlation ID: {userInfo.correlationId}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
