import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/**
 * Firebase configuration from environment variables.
 * 
 * These values should be set in .env file:
 * VITE_FIREBASE_PROJECT_ID=lexicon-master-adb6b
 * VITE_FIREBASE_API_KEY=your_api_key
 * VITE_FIREBASE_AUTH_DOMAIN=lexicon-master-adb6b.firebaseapp.com
 * VITE_FIREBASE_DATABASE_URL=https://lexicon-master-adb6b-default-rtdb.firebaseio.com
 * VITE_FIREBASE_STORAGE_BUCKET=lexicon-master-adb6b.firebasestorage.app
 * VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * VITE_FIREBASE_APP_ID=your_app_id
 * VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
 */

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'lexicon-master-dev',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dev-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'http://localhost:9000',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dev-bucket',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'dev-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'dev-measurement-id',
}

// Validate required configuration (development mode)
const requiredEnvVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_APP_ID',
] as const

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])

if (missingVars.length > 0 && import.meta.env.MODE === 'production') {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure all required Firebase configuration is set.'
  )
}

if (missingVars.length > 0 && import.meta.env.MODE === 'development') {
  console.warn('⚠️  Development mode: Using mock Firebase configuration')
  console.warn('Missing environment variables:', missingVars.join(', '))
}

/**
 * Initialize Firebase app instance.
 * This should be called once at application startup.
 */
export const initializeFirebaseApp = () => {
  try {
    const app = initializeApp(firebaseConfig)
    console.log('Firebase app initialized successfully')
    return app
  } catch (error) {
    console.error('Failed to initialize Firebase app:', error)
    throw error
  }
}

// Lazy initialization - Firebase services are created on first access
let app: ReturnType<typeof initializeApp> | null = null
let auth: ReturnType<typeof getAuth> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let storage: ReturnType<typeof getStorage> | null = null

/**
 * Get Firebase app instance (lazy initialization)
 */
export const getFirebaseApp = () => {
  if (!app) {
    app = initializeFirebaseApp()
  }
  return app
}

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

/**
 * Get Firestore instance
 */
export const getFirestoreDB = () => {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

/**
 * Export configuration for debugging (remove in production)
 */
export const getFirebaseConfig = () => ({ ...firebaseConfig })

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = () => {
  return missingVars.length === 0
}
