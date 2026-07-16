/**
 * Admin Service - Firebase Custom Claims Management
 *
 * This service uses the Firebase Admin SDK to set custom claims on user accounts.
 * Custom claims are used for role-based access control (RBAC) in the application.
 *
 * Security Note:
 * - This service MUST only be used in server-side contexts or admin scripts
 * - Never expose the Firebase Admin SDK to client-side code
 * - Service account credentials must be kept secure
 */

import admin from 'firebase-admin'
import * as path from 'node:path'

/**
 * Initialize Firebase Admin SDK with service account credentials
 */
let adminApp: admin.app.App | null = null

function getAdminApp(): admin.app.App {
  if (!adminApp) {
    // Path to service account key from project root
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json')
    
    try {
      const serviceAccount = require(serviceAccountPath)
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      
      console.log('✅ [ADMIN_SERVICE] Firebase Admin SDK initialized successfully')
    } catch (error) {
      console.error('❌ [ADMIN_SERVICE] Failed to initialize Firebase Admin SDK:', error)
      throw new Error(
        'Failed to initialize Firebase Admin SDK. ' +
        'Ensure service-account.json exists in the project root.'
      )
    }
  }
  
  return adminApp
}

/**
 * Set SuperAdmin custom claim for a user by UID
 *
 * @param uid - User Firebase UID
 * @returns Promise that resolves when the claim is set
 */
export async function setSuperAdminClaimByUid(uid: string): Promise<void> {
  console.log(`🔧 [ADMIN_SERVICE] Setting SuperAdmin claim for UID: ${uid}`)
  const auth = getAdminApp().auth()
  
  try {
    // Set custom claim directly by UID
    await auth.setCustomUserClaims(uid, {
      superadmin: true,
    })
    
    console.log(`✅ [ADMIN_SERVICE] SuperAdmin claim set for user UID: ${uid}`)
  } catch (error) {
    console.error(`❌ [ADMIN_SERVICE] Failed to set SuperAdmin claim for UID ${uid}:`, error)
    throw error
  }
}

/**
 * Set SuperAdmin custom claim for a user
 *
 * @param email - User email address
 * @returns Promise that resolves when the claim is set
 */
export async function setSuperAdminClaim(email: string): Promise<void> {
  const auth = getAdminApp().auth()
  
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email)
    
    // Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, {
      superadmin: true,
    })
    
    console.log(`✅ [ADMIN_SERVICE] SuperAdmin claim set for user: ${email} (${userRecord.uid})`)
  } catch (error) {
    console.error(`❌ [ADMIN_SERVICE] Failed to set SuperAdmin claim for ${email}:`, error)
    throw error
  }
}

/**
 * Remove SuperAdmin custom claim from a user
 *
 * @param email - User email address
 * @returns Promise that resolves when the claim is removed
 */
export async function removeSuperAdminClaim(email: string): Promise<void> {
  const auth = getAdminApp().auth()
  
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email)
    
    // Remove custom claim by setting it to null
    await auth.setCustomUserClaims(userRecord.uid, {
      superadmin: null,
    })
    
    console.log(`✅ [ADMIN_SERVICE] SuperAdmin claim removed from user: ${email} (${userRecord.uid})`)
  } catch (error) {
    console.error(`❌ [ADMIN_SERVICE] Failed to remove SuperAdmin claim for ${email}:`, error)
    throw error
  }
}

/**
 * Check if a user has SuperAdmin claim
 *
 * @param email - User email address
 * @returns Promise that resolves to true if user has SuperAdmin claim
 */
export async function hasSuperAdminClaim(email: string): Promise<boolean> {
  const auth = getAdminApp().auth()
  
  try {
    const userRecord = await auth.getUserByEmail(email)
    const claims = userRecord.customClaims || {}
    
    return claims.superadmin === true
  } catch (error) {
    console.error(`❌ [ADMIN_SERVICE] Failed to check SuperAdmin claim for ${email}:`, error)
    return false
  }
}

/**
 * Set Admin custom claim for a user
 *
 * @param email - User email address
 * @returns Promise that resolves when the claim is set
 */
export async function setAdminClaim(email: string): Promise<void> {
  const auth = getAdminApp().auth()
  
  try {
    const userRecord = await auth.getUserByEmail(email)
    
    await auth.setCustomUserClaims(userRecord.uid, {
      admin: true,
    })
    
    console.log(`✅ [ADMIN_SERVICE] Admin claim set for user: ${email} (${userRecord.uid})`)
  } catch (error) {
    console.error(`❌ [ADMIN_SERVICE] Failed to set Admin claim for ${email}:`, error)
    throw error
  }
}

/**
 * Get all users with SuperAdmin claims
 *
 * @returns Promise that resolves to list of user emails with SuperAdmin claim
 */
export async function getSuperAdminUsers(): Promise<string[]> {
  const auth = getAdminApp().auth()
  
  try {
    const listResult = await auth.listUsers()
    const superAdminEmails: string[] = []
    
    for (const userRecord of listResult.users) {
      const claims = userRecord.customClaims || {}
      if (claims.superadmin === true) {
        superAdminEmails.push(userRecord.email || '')
      }
    }
    
    return superAdminEmails
  } catch (error) {
    console.error('❌ [ADMIN_SERVICE] Failed to list SuperAdmin users:', error)
    throw error
  }
}

/**
 * CLI script to set SuperAdmin claim for a specific user
 * Usage: npx tsx src/services/adminService.ts set-superadmin terrythemeat@duck.com
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const identifier = args[1]
  
  if (!command || !identifier) {
    console.log('Usage:')
    console.log('  npx tsx src/services/adminService.ts set-superadmin <email>')
    console.log('  npx tsx src/services/adminService.ts set-superadmin-by-uid <uid>')
    console.log('  npx tsx src/services/adminService.ts remove-superadmin <email>')
    console.log('  npx tsx src/services/adminService.ts check-superadmin <email>')
    console.log('  npx tsx src/services/adminService.ts list-superadmins')
    process.exit(1)
  }
  
  try {
    switch (command) {
      case 'set-superadmin':
        await setSuperAdminClaim(identifier)
        console.log(`✅ SuperAdmin claim successfully set for ${identifier}`)
        console.log('⚠️  User must sign out and sign back in for claims to take effect')
        break
      
      case 'set-superadmin-by-uid':
        await setSuperAdminClaimByUid(identifier)
        console.log(`✅ SuperAdmin claim successfully set for UID ${identifier}`)
        console.log('⚠️  User must sign out and sign back in for claims to take effect')
        break
      
      case 'remove-superadmin':
        await removeSuperAdminClaim(identifier)
        console.log(`✅ SuperAdmin claim successfully removed from ${identifier}`)
        console.log('⚠️  User must sign out and sign back in for claims to take effect')
        break
      
      case 'check-superadmin':
        const hasClaim = await hasSuperAdminClaim(identifier)
        console.log(`${identifier} ${hasClaim ? 'HAS' : 'DOES NOT HAVE'} SuperAdmin claim`)
        break
      
      case 'list-superadmins':
        const superAdmins = await getSuperAdminUsers()
        console.log('SuperAdmin users:', superAdmins)
        break
      
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (error) {
    console.error('Error executing command:', error)
    process.exit(1)
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
