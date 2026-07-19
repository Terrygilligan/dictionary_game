/**
 * Crypto-Shredding Utility for GDPR Compliance (Browser Version)
 * 
 * This utility provides encryption/decryption functions for sensitive data
 * in event logs, enabling secure data storage and the ability to "shred"
 * data by destroying encryption keys.
 * 
 * Future Implementation: Key Management Service (KMS)
 * TODO: Enhance KeyManager to support per-user encryption keys with key_id mapping
 * TODO: Implement key rotation and destruction for GDPR "Right to be Forgotten"
 * See SCRATCHPAD.md entry 0013 for GDPR & Crypto-Shredding Readiness
 */

import { createLogger } from '@/shared/lib/logger'

const logger = createLogger('CRYPTO_SHREDDING')

// Web Crypto API for browser compatibility
const crypto = window.crypto

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'AES-GCM'
const SALT_LENGTH = 32
const IV_LENGTH = 12

export interface EncryptedData {
  data: string // Base64 encrypted data
  salt: string // Base64 salt
  iv: string // Base64 initialization vector
  tag: string // Base64 authentication tag
  algorithm: string
  keyId?: string // Optional key identifier for key rotation
}

export interface EncryptionKey {
  id: string
  key: CryptoKey
  createdAt: number
  isActive: boolean
  expiresAt?: number
}

/**
 * Key management for crypto-shredding
 */
export class KeyManager {
  private keys = new Map<string, EncryptionKey>()

  async generateKey(keyId?: string): Promise<EncryptionKey> {
    const id = keyId || this.generateKeyId()
    const key = await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_ALGORITHM,
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )

    const encryptionKey: EncryptionKey = {
      id,
      key,
      createdAt: Date.now(),
      isActive: true,
    }

    this.keys.set(id, encryptionKey)
    return encryptionKey
  }

  getKey(keyId: string): EncryptionKey | undefined {
    return this.keys.get(keyId)
  }

  getActiveKey(): EncryptionKey | undefined {
    return Array.from(this.keys.values()).find(key => 
      key.isActive && (!key.expiresAt || key.expiresAt > Date.now())
    )
  }

  deactivateKey(keyId: string): void {
    const key = this.keys.get(keyId)
    if (key) {
      key.isActive = false
    }
  }

  deleteKey(keyId: string): void {
    this.keys.delete(keyId)
  }

  getActiveKeys(): EncryptionKey[] {
    return Array.from(this.keys.values()).filter(key => 
      key.isActive && (!key.expiresAt || key.expiresAt > Date.now())
    )
  }

  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global key manager instance
const keyManager = new KeyManager()

/**
 * Encrypt sensitive data
 */
export async function encryptSensitiveData(data: string, customKeyId?: string): Promise<EncryptedData> {
  const key = customKeyId ? keyManager.getKey(customKeyId) : await keyManager.generateKey()
  
  if (!key) {
    throw new Error('No encryption key available')
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    key.key,
    dataBuffer
  )

  const encrypted = new Uint8Array(encryptedBuffer)

  return {
    data: arrayBufferToBase64(encrypted.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    tag: '', // AES-GCM includes authentication tag in the encrypted data
    algorithm: ENCRYPTION_ALGORITHM,
    keyId: key.id,
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
  const key = keyManager.getKey(encryptedData.keyId || '')
  
  if (!key) {
    throw new Error('Encryption key not found - data may be shredded')
  }

  const iv = base64ToArrayBuffer(encryptedData.iv)
  const encrypted = base64ToArrayBuffer(encryptedData.data)

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    key.key,
    encrypted
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

/**
 * Crypto-shred data by destroying the encryption key
 */
export function cryptoShredData(keyId: string): void {
  keyManager.deleteKey(keyId)
  logger.log(`Encryption key ${keyId} has been destroyed. Data is now unrecoverable.`)
}

/**
 * Get encryption metadata
 */
export function getEncryptionInfo() {
  return {
    algorithm: ENCRYPTION_ALGORITHM,
    keyLength: 256,
    activeKeys: keyManager.getActiveKeys().length,
    timestamp: Date.now(),
  }
}

/**
 * Encrypt user profile data
 */
export async function encryptUserProfile(profile: Record<string, any>): Promise<Record<string, any>> {
  const sensitiveFields = ['email', 'displayName']
  const encryptedProfile = { ...profile }

  for (const field of sensitiveFields) {
    if (profile[field]) {
      encryptedProfile[field] = await encryptSensitiveData(String(profile[field]))
    }
  }

  return encryptedProfile
}

/**
 * Decrypt user profile data
 */
export async function decryptUserProfile(encryptedProfile: Record<string, any>): Promise<Record<string, any>> {
  const sensitiveFields = ['email', 'displayName']
  const decrypted = { ...encryptedProfile }

  for (const field of sensitiveFields) {
    if (encryptedProfile[field] && typeof encryptedProfile[field] === 'object') {
      try {
        decrypted[field] = await decryptSensitiveData(encryptedProfile[field])
      } catch (error) {
        logger.warn(`Failed to decrypt ${field}:`, error)
        decrypted[field] = '[encrypted]'
      }
    }
  }

  return decrypted
}

/**
 * Encrypt event log data
 */
export async function encryptEventLog(eventLog: { matchId: string; createdAt: number; events: any[] }): Promise<Record<string, any>> {
  const encryptedEventLog = {
    matchId: eventLog.matchId,
    createdAt: eventLog.createdAt,
    events: [] as any[],
  }

  for (const event of eventLog.events) {
    const encryptedEvent = { ...event }
    
    // Encrypt sensitive event data
    if (event.userId) {
      encryptedEvent.userId = await encryptSensitiveData(String(event.userId))
    }
    
    encryptedEventLog.events.push(encryptedEvent)
  }

  return encryptedEventLog
}

/**
 * Decrypt event log data
 */
export async function decryptEventLog(encryptedEventLog: Record<string, any>): Promise<{ matchId: string; createdAt: number; events: any[] }> {
  const decryptedEventLog = {
    matchId: encryptedEventLog.matchId,
    createdAt: encryptedEventLog.createdAt || 0,
    events: [] as any[],
  }

  for (const event of encryptedEventLog.events || []) {
    const decryptedEvent = { ...event }
    
    // Decrypt sensitive event data
    if (event.userId && typeof event.userId === 'object') {
      try {
        decryptedEvent.userId = await decryptSensitiveData(event.userId)
      } catch (error) {
        logger.warn('Failed to decrypt userId in event:', error)
        decryptedEvent.userId = '[encrypted]'
      }
    }
    
    decryptedEventLog.events.push(decryptedEvent)
  }

  return decryptedEventLog
}

/**
 * Utility functions for Base64 conversion
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Initialize key manager with a default key
 */
export async function initializeCryptoShredding(): Promise<void> {
  if (keyManager.getActiveKeys().length === 0) {
    await keyManager.generateKey('default')
    logger.log('Crypto-shredding initialized with default key')
  }
}

// Export key manager for advanced usage
export { keyManager }
