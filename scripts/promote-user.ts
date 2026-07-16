import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../service-account.json'), 'utf8')
)

initializeApp({
  credential: cert(serviceAccount),
})

const UID = 'rh4qF3WPZwh9ariwPdS1sHHksZT2'
const CLAIMS = { superadmin: true }

try {
  await getAuth().setCustomUserClaims(UID, CLAIMS)
  console.log(`Successfully set custom claims for UID ${UID}:`, CLAIMS)
} catch (error) {
  console.error('Failed to set custom user claims:', error)
  process.exit(1)
}
