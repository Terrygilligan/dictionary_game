/**
 * Secure Logger Utility
 * 
 * Sanitizes sensitive information (PII, UIDs, tenant IDs) from logs
 * while preserving diagnostic information like correlation IDs for debugging.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info'

/**
 * Keys that contain sensitive information and should be redacted
 */
const SENSITIVE_KEYS = [
  'tenant_id',
  'aggregate_id',
  'userId',
  'user_id',
  'uid',
  'email',
  'emailVerified',
  'claims',
  'customClaims',
  'idToken',
  'accessToken',
  'refreshToken',
  'password',
  'displayName',
  'phoneNumber',
  'photoURL',
  'providerData',
]

/**
 * Keys that should be preserved for debugging (non-sensitive diagnostic IDs)
 */
const PRESERVED_KEYS = [
  'correlationId',
  'eventId',
  'auditId',
  'traceId',
  'requestId',
  'transactionId',
]

/**
 * Sanitizes an object by redacting sensitive values
 * @param obj - The object to sanitize
 * @returns A sanitized copy of the object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  const sanitized: any = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase()
      
      // Preserve diagnostic IDs
      if (PRESERVED_KEYS.some(preservedKey => lowerKey.includes(preservedKey.toLowerCase()))) {
        sanitized[key] = obj[key]
      }
      // Redact sensitive keys
      else if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase()))) {
        sanitized[key] = '[REDACTED]'
      }
      // Recursively sanitize nested objects
      else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key])
      }
      // Keep primitive values as-is
      else {
        sanitized[key] = obj[key]
      }
    }
  }

  return sanitized
}

/**
 * Sanitizes arguments by redacting sensitive information
 * @param args - The arguments to sanitize
 * @returns Sanitized arguments
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      // Check if string looks like it might contain sensitive data
      if (arg.includes('tenant_id') || arg.includes('aggregate_id') || arg.includes('uid=')) {
        return arg.replace(/(tenant_id|aggregate_id|uid|userId|user_id)=["']?([^"'\s,}]+)/gi, '$1=[REDACTED]')
      }
      return arg
    }
    return sanitizeObject(arg)
  })
}

/**
 * Formats log arguments for consistent output
 * @param args - The arguments to format
 * @returns Formatted arguments
 */
function formatArgs(args: any[]): any[] {
  if (args.length === 0) return args
  
  // If first arg is a string with placeholders, use console formatting
  if (typeof args[0] === 'string' && (args[0].includes('%s') || args[0].includes('%d') || args[0].includes('%j'))) {
    return args
  }
  
  return args
}

/**
 * Determines if we're in production environment
 */
function isProduction(): boolean {
  return import.meta.env.MODE === 'production'
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  enableDebug: boolean
  enableInfo: boolean
  sanitize: boolean
}

let config: LoggerConfig = {
  enableDebug: !isProduction(),
  enableInfo: !isProduction(),
  sanitize: true,
}

/**
 * Configure the logger
 */
export function configureLogger(options: Partial<LoggerConfig> = {}) {
  config = {
    ...config,
    ...options,
  }
}

/**
 * Core logging function with sanitization
 */
function coreLog(level: LogLevel, ...args: any[]) {
  const shouldLog = 
    level === 'error' || 
    (level === 'warn' && config.enableInfo) ||
    (level === 'info' && config.enableInfo) ||
    (level === 'debug' && config.enableDebug) ||
    (level === 'log' && config.enableDebug)

  if (!shouldLog) {
    return
  }

  const formattedArgs = formatArgs(args)
  const outputArgs = config.sanitize ? sanitizeArgs(formattedArgs) : formattedArgs

  switch (level) {
    case 'error':
      console.error(...outputArgs)
      break
    case 'warn':
      console.warn(...outputArgs)
      break
    case 'info':
      console.info(...outputArgs)
      break
    case 'debug':
      console.debug(...outputArgs)
      break
    default:
      console.log(...outputArgs)
  }
}

/**
 * Logger interface
 */
export interface Logger {
  log(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  debug(...args: any[]): void
  info(...args: any[]): void
}

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string): Logger {
  return {
    log: (...args: any[]) => coreLog('log', `[${prefix}]`, ...args),
    warn: (...args: any[]) => coreLog('warn', `[${prefix}]`, ...args),
    error: (...args: any[]) => coreLog('error', `[${prefix}]`, ...args),
    debug: (...args: any[]) => coreLog('debug', `[${prefix}]`, ...args),
    info: (...args: any[]) => coreLog('info', `[${prefix}]`, ...args),
  }
}

/**
 * Default logger instance
 */
export const logger: Logger = {
  log: (...args: any[]) => coreLog('log', ...args),
  warn: (...args: any[]) => coreLog('warn', ...args),
  error: (...args: any[]) => coreLog('error', ...args),
  debug: (...args: any[]) => coreLog('debug', ...args),
  info: (...args: any[]) => coreLog('info', ...args),
}

/**
 * Export individual functions for convenience
 */
export const log = logger.log.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
