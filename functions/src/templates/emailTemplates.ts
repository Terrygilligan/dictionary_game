/**
 * Email Template Mapper
 * 
 * Provides a centralized way to manage email templates with type-safe data structures.
 * Each template returns { subject: string, html: string } for use with email providers.
 */

export interface EmailContent {
  subject: string;
  html: string;
}

export interface WelcomeRegistrationData {
  username?: string;
  email: string;
  userId: string;
}

export interface PasswordResetData {
  resetLink?: string;
  email: string;
  userId: string;
}

export interface EmailVerificationData {
  email: string;
  userId: string;
  displayName?: string;
}

export type TemplateData = WelcomeRegistrationData | PasswordResetData | EmailVerificationData | Record<string, any>;

/**
 * Get email content based on template type
 * 
 * @param type - The template type (e.g., 'welcome_registration', 'password_reset', 'email_verification')
 * @param data - The data object for template interpolation
 * @returns Email content with subject and HTML body
 * @throws Error if template type is unknown
 */
export function getEmailContent(type: string, data: TemplateData): EmailContent {
  switch (type) {
    case 'welcome_registration':
      return getWelcomeRegistrationContent(data as WelcomeRegistrationData);
    
    case 'password_reset':
      return getPasswordResetContent(data as PasswordResetData);
    
    case 'email_verification':
      return getEmailVerificationContent(data as EmailVerificationData);
    
    default:
      throw new Error(`Unknown email template: ${type}`);
  }
}

/**
 * Welcome registration email template
 */
function getWelcomeRegistrationContent(data: WelcomeRegistrationData): EmailContent {
  const { username, email, userId } = data;
  const displayName = username || email.split('@')[0] || 'User';
  
  return {
    subject: 'Welcome to Lexicon Master!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Lexicon Master!</h1>
        <p>Hi ${displayName},</p>
        <p>Welcome to Lexicon Master! We're excited to have you join our community.</p>
        <p>Your account has been successfully created with user ID: ${userId}</p>
        <p>You can now start playing and improving your vocabulary skills.</p>
        <p>Best regards,<br>The Lexicon Master Team</p>
      </div>
    `,
  };
}

/**
 * Password reset email template
 */
function getPasswordResetContent(data: PasswordResetData): EmailContent {
  const { resetLink, email, userId } = data;
  
  const resetButtonHtml = resetLink 
    ? `<a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>`
    : '<p style="color: #666;">Please contact support to reset your password.</p>';
  
  return {
    subject: 'Password reset request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password reset request</h1>
        <p>Hi ${email},</p>
        <p>We received a request to reset your password for your Lexicon Master account.</p>
        <p>Your user ID: ${userId}</p>
        ${resetButtonHtml}
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The Lexicon Master Team</p>
      </div>
    `,
  };
}

/**
 * Email verification email template
 */
function getEmailVerificationContent(data: EmailVerificationData): EmailContent {
  const { email, userId, displayName } = data;
  const display = displayName || email.split('@')[0] || 'User';
  
  return {
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Verify your email address</h1>
        <p>Hi ${display},</p>
        <p>Thank you for registering with Lexicon Master!</p>
        <p>Your user ID: ${userId}</p>
        <p>Please verify your email address by clicking the verification link in your registration email or by logging into your account.</p>
        <p>If you didn't create an account with Lexicon Master, you can safely ignore this email.</p>
        <p>Best regards,<br>The Lexicon Master Team</p>
      </div>
    `,
  };
}
