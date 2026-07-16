import { useState } from 'react'
import { useTranslate } from '@/shared/lib/i18n/useTranslate'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher'
import { PasswordInput } from '@/shared/ui/PasswordInput'
import { authCommandService, CorrelationHelper } from '@/services/AuthCommandService'
import type { RegisterUserCommand, SignInCommand } from '@/services/AuthCommandService'
import type { User } from '@/entities/user'

interface AuthPageProps {
  onAuthSuccess: (user?: User) => void
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { t } = useTranslate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  // const [emailSent, setEmailSent] = useState(false) // TODO: Implement email verification flow
  const [verificationMessage, setVerificationMessage] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp && !acceptTerms) {
      setError(t('auth.mustAcceptTerms'))
      return
    }
    
    setIsLoading(true)
    setError('')
    setVerificationMessage('')

    try {
      if (isSignUp) {
        // Event-Sourced Registration Flow with AuthCommandService
        console.log('🔐 [AUTH] Starting event-sourced registration with command service...')
        
        // Step 1: Create registration command with correlation tracking
        const registerCommand: RegisterUserCommand = {
          type: 'REGISTER_USER',
          correlationId: CorrelationHelper.generateCorrelationId(),
          timestamp: CorrelationHelper.generateTimestamp(),
          payload: {
            email: formData.email,
            password: formData.password,
            displayName: formData.displayName,
            acceptTerms: acceptTerms,
          },
        }

        console.log('📋 [AUTH] Registration command created:', {
          correlationId: registerCommand.correlationId,
          timestamp: registerCommand.timestamp,
        })

        // Step 2: Execute through AuthCommandService (handles Firebase + Event Store)
        const result = await authCommandService.registerUser(registerCommand)
        
        if (!result.success) {
          setError(result.error || t('errors.unknown'))
          return
        }

        console.log('✅ [AUTH] Registration successful:', {
          correlationId: result.correlationId,
          userId: result.user?.id,
        })
        
        // Step 3: Show verification message
        setVerificationMessage(t('auth.verificationEmailSent'))
        
      } else {
        // Sign In Flow with AuthCommandService
        const signInCommand: SignInCommand = {
          type: 'SIGN_IN',
          correlationId: CorrelationHelper.generateCorrelationId(),
          timestamp: CorrelationHelper.generateTimestamp(),
          payload: {
            email: formData.email,
            password: formData.password,
          },
        }

        const result = await authCommandService.signInUser(signInCommand)

        if (result.success && result.user) {
          onAuthSuccess(result.user)
        } else {
          setError(result.error || t('errors.unknown'))
        }
      }
    } catch (err) {
      console.error('❌ [AUTH] Registration failed:', err)
      setError(t('errors.unknown'))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setVerificationMessage('')
    // setEmailSent(false) // TODO: Implement email verification flow
    setFormData({ email: '', password: '', displayName: '' })
  }

  const handleResendVerification = async () => {
    try {
      const result = await authCommandService.sendEmailVerification()
      
      if (result.success) {
        setVerificationMessage(t('auth.verificationEmailResent'))
      } else {
        setError(result.error || t('auth.verificationEmailError'))
      }
    } catch (resendError) {
      console.error('Resend verification failed:', resendError)
      setError(t('auth.verificationEmailError'))
    }
  }

  return (
    <div className="page">
      <div className="page__masthead">
        <div className="page__header">
          <h1 className="page__title">
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </h1>
          <LanguageSwitcher className="page__language-switcher" />
        </div>
        <p className="page__tagline">
          {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
        </p>
      </div>

      <div className="panel panel--center">
        <form onSubmit={handleSubmit} className="auth__form">
          {error && <div className="auth__error">{error}</div>}

          {isSignUp && (
            <div>
              <input
                type="text"
                placeholder={t('auth.displayName')}
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="auth__input"
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="auth__input"
              required
            />
          </div>

          <PasswordInput
            value={formData.password}
            onChange={(value) => handleInputChange('password', value)}
            placeholder={t('auth.password')}
            required
            className="auth__input"
          />

          {isSignUp && (
            <div className="auth__terms">
              <label className="auth__checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="auth__checkbox"
                />
                <span>
                  {t('auth.acceptTerms')}{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="auth__link">
                    {t('auth.privacyPolicy')}
                  </a>
                  {' '}{t('auth.and')}{' '}
                  <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="auth__link">
                    {t('auth.termsOfService')}
                  </a>
                </span>
              </label>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || (isSignUp && !acceptTerms)}
            className="auth__submit"
          >
            {isLoading ? t('ui.loading') : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
          </Button>
        </form>

        {verificationMessage && (
          <div className="auth__verification-message">
            <p>{verificationMessage}</p>
            <Button variant="ghost" onClick={handleResendVerification}>
              {t('auth.resendVerification')}
            </Button>
          </div>
        )}

        <div className="auth__toggle">
          {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
          <button type="button" onClick={toggleMode} className="auth__toggle-link">
            {isSignUp ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </div>
      </div>

      <div className="panel panel--center">
        <h2 className="panel__title">{t('auth.forgotPassword')}</h2>
        <p className="panel__lead">{t('auth.forgotPasswordHelp')}</p>
        <Button variant="ghost" onClick={() => setError(t('errors.notImplemented'))}>
          {t('auth.resetPassword')}
        </Button>
      </div>
    </div>
  )
}
