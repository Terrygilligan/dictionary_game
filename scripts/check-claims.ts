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

const EMAIL = process.argv[2]

if (!EMAIL) {
  console.error('Usage: npx tsx scripts/check-claims.ts <email@example.com>')
  process.exit(1)
}

interface CustomClaims {
  superadmin?: boolean
  admin?: boolean
  [key: string]: unknown
}

try {
  const userRecord = await getAuth().getUserByEmail(EMAIL)
  console.log('✅ User found:', userRecord.uid)
  console.log('📧 Email:', userRecord.email)
  console.log('\n📋 Custom Claims:')
  console.log(JSON.stringify(userRecord.customClaims, null, 2))
  
  const claims: CustomClaims = (userRecord.customClaims || {}) as CustomClaims
  
  console.log('\n🔍 Claim Status:')
  console.log(`  - superadmin (lowercase): ${claims.superadmin === true ? '✅ PRESENT' : '❌ ABSENT'}`)
  console.log(`  - admin (lowercase): ${claims.admin === true ? '✅ PRESENT' : '❌ ABSENT'}`)
  
  if (claims.superadmin !== true && claims.admin !== true) {
    console.log('\n⚠️  User has no admin claims. Admin dashboard access will be denied.')
  } else {
    console.log('\n✅ User has admin claims. Admin dashboard access should be granted.')
  }
} catch (error: unknown) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
