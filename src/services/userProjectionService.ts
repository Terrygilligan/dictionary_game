import { dbService } from './db'
import type { UserEvent, UserCreated, UserRegistered, UserUpdated, UserEmailVerified, ProfileUpdated, StatsUpdated } from '@/entities/user'

/**
 * Service for projecting user events to Firestore collections
 * Handles GDPR encryption requirements for user data storage
 */
export class UserProjectionService {
  /**
   * Validate location fields to prevent malicious input
   * @param village - Village name to validate
   * @param postcode - Postcode to validate
   * @throws Error if validation fails
   */
  private validateLocationFields(village?: string, postcode?: string): void {
    // Village validation: alphanumeric, spaces, hyphens, length 2-50
    if (village !== undefined) {
      const villagePattern = /^[a-zA-Z0-9\s\-]{2,50}$/
      if (!villagePattern.test(village)) {
        throw new Error(`Invalid village format: "${village}". Only alphanumeric characters, spaces, and hyphens allowed (2-50 characters).`)
      }
    }

    // Postcode validation: alphanumeric, spaces, hyphens, length 2-10
    if (postcode !== undefined) {
      const postcodePattern = /^[a-zA-Z0-9\s\-]{2,10}$/
      if (!postcodePattern.test(postcode)) {
        throw new Error(`Invalid postcode format: "${postcode}". Only alphanumeric characters, spaces, and hyphens allowed (2-10 characters).`)
      }
    }
  }
  /**
   * Process user events and update Firestore projections
   */
  async processUserEvent(event: UserEvent): Promise<void> {
    try {
      // 🔍 DEBUG LOG: Event received by projection service
      console.log('🔍 [PROJECTION] User event received:', {
        type: event.type,
        userId: this.getUserIdFromEvent(event),
        timestamp: this.getTimestampFromEvent(event)
      })

      switch (event.type) {
        case 'user/created':
        case 'user/registered':
          await this.handleUserProjection(event)
          break
        case 'user/updated':
          await this.handleUserUpdatedProjection(event)
          break
        case 'user/email-verified':
          await this.handleEmailVerifiedProjection(event)
          break
        case 'profile/updated':
          await this.handleProfileProjection(event)
          break
        case 'stats/updated':
          await this.handleStatsProjection(event)
          break
        case 'achievement/unlocked':
          await this.handleAchievementProjection(event)
          break
        case 'friend/added':
        case 'friend/removed':
          await this.handleFriendProjection(event)
          break
        case 'sync/completed':
          await this.handleSyncProjection(event)
          break
        default:
          console.log(`ℹ️ [PROJECTION] Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error('❌ [PROJECTION] Error processing user event:', error)
      throw error
    }
  }

  /**
   * Helper to get userId from different event types
   */
  private getUserIdFromEvent(event: UserEvent): string {
    if ('userId' in event) return event.userId
    return 'unknown'
  }

  /**
   * Helper to get timestamp from different event types
   */
  private getTimestampFromEvent(event: UserEvent): number {
    if ('timestamp' in event) return event.timestamp
    if ('createdAt' in event) return event.createdAt
    return Date.now()
  }

  /**
   * Handle user creation/registration events - write to users collection
   */
  private async handleUserProjection(event: UserCreated | UserRegistered): Promise<void> {
    const userId = event.userId
    
    // 🔍 DEBUG LOG: Handling user projection
    console.log('🔍 [PROJECTION] Handling user projection for:', {
      userId,
      eventType: event.type,
      email: event.email,
      displayName: event.displayName,
      emailVerified: 'emailVerified' in event ? event.emailVerified : false,
    })

    try {
      // Create user profile with stats
      const userProfile = {
        id: userId,
        email: event.email,
        displayName: event.displayName,
        emailVerified: 'emailVerified' in event ? event.emailVerified : false,
        createdAt: event.createdAt,
        updatedAt: Date.now(),
        // Stats will be handled separately
        stats: {
          gamesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          streak: 0,
          highestStreak: 0,
          updatedAt: Date.now(),
        }
      }

      // 🔍 DEBUG LOG: About to save user profile (encryption handled by dbService)
      console.log('🔍 [PROJECTION] About to save user profile for:', {
        userId,
        hasStats: !!userProfile.stats,
        profileSize: JSON.stringify(userProfile).length
      })

      const profileData = {
        ...userProfile,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'user-projection',
          eventType: event.type,
          processedAt: new Date().toISOString(),
        }
      }

      // 🔍 DEBUG LOG: Writing profile to Firestore (encryption handled by dbService)
      console.log('🔍 [PROJECTION] Writing profile to Firestore for user:', userId)
      
      await dbService.saveUserProfile(userId, profileData)
      
      console.log(`✅ [PROJECTION] User profile saved to Firestore for user ${userId}`)
    } catch (error) {
      console.error(`❌ [PROJECTION] Failed to save user profile for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Handle user updates
   */
  private async handleUserUpdatedProjection(event: UserUpdated): Promise<void> {
    const userId = event.userId
    console.log('🔍 [PROJECTION] Handling user update for user:', userId)
    
    try {
      // Load existing profile
      const existingProfile = await dbService.loadUserProfile(userId)
      
      if (!existingProfile) {
        console.log(`⚠️ [PROJECTION] No existing profile found for user ${userId}, creating new one`)
        // Create a basic profile for this user
        const basicProfile = {
          id: userId,
          email: '', // Will be populated from auth service
          displayName: event.displayName || '',
          emailVerified: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        return this.handleUserProjection({
          type: 'user/created',
          userId,
          email: basicProfile.email,
          displayName: basicProfile.displayName,
          createdAt: basicProfile.createdAt,
        })
      }

      // Update with new data
      const updatedProfile = {
        ...existingProfile,
        displayName: event.displayName || existingProfile.displayName,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'user-projection',
          eventType: event.type,
          processedAt: new Date().toISOString(),
        }
      }

      await dbService.saveUserProfile(userId, updatedProfile)
      
      console.log(`✅ [PROJECTION] User updated for user ${userId}`)
    } catch (error) {
      console.error(`❌ [PROJECTION] Failed to update user for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Handle profile updates
   */
  private async handleProfileProjection(event: ProfileUpdated): Promise<void> {
    const userId = event.userId
    console.log('🔍 [PROJECTION] Handling profile update for user:', userId)
    
    try {
      // Security Guard: Validate location fields before processing
      if (event.village !== undefined || event.postcode !== undefined) {
        console.log('🛡️ [SECURITY] Validating location fields for user:', userId)
        this.validateLocationFields(event.village, event.postcode)
        console.log('✅ [SECURITY] Location fields validation passed')
      }

      // Load existing profile
      const existingProfile = await dbService.loadUserProfile(userId)
      
      if (!existingProfile) {
        console.log(`⚠️ [PROJECTION] No existing profile found for user ${userId}, creating new one`)
        // Create a basic profile for this user
        const basicProfile = {
          id: userId,
          email: '', // Will be populated from auth service
          displayName: '', // Will be populated from auth service
          emailVerified: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: Date.now(),
          },
        }
        return this.handleUserProjection({
          type: 'user/created',
          userId,
          email: basicProfile.email,
          displayName: basicProfile.displayName,
          createdAt: basicProfile.createdAt,
        })
      }

      // Update with new data
      const updatedProfile = {
        ...existingProfile,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'user-projection',
          eventType: event.type,
          processedAt: new Date().toISOString(),
        }
      }

      if (event.totalScore !== undefined) {
        updatedProfile.totalScore = event.totalScore
      }
      if (event.matchesPlayed !== undefined) {
        updatedProfile.matchesPlayed = event.matchesPlayed
      }
      if (event.village !== undefined) {
        updatedProfile.village = event.village
      }
      if (event.postcode !== undefined) {
        updatedProfile.postcode = event.postcode
      }
      if (event.shareLocationForLeaderboard !== undefined) {
        updatedProfile.shareLocationForLeaderboard = event.shareLocationForLeaderboard
      }

      await dbService.saveUserProfile(userId, updatedProfile)
      
      console.log(`✅ [PROJECTION] Profile updated for user ${userId}`)
    } catch (error) {
      // Check if this is a validation error
      if (error instanceof Error && error.message.includes('Invalid')) {
        console.error(`🛡️ [SECURITY] Validation failed for user ${userId}:`, error.message)
        console.error(`🚫 [SECURITY] Profile update aborted due to invalid input`)
        // Don't re-throw validation errors to prevent them from being saved
        return
      }
      
      console.error(`❌ [PROJECTION] Failed to update profile for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Handle stats updates
   */
  private async handleStatsProjection(event: StatsUpdated): Promise<void> {
    const userId = event.userId
    console.log('🔍 [PROJECTION] Handling stats update for user:', userId)
    
    try {
      // Load existing profile
      const existingProfile = await dbService.loadUserProfile(userId)
      
      if (!existingProfile) {
        console.log(`⚠️ [PROJECTION] No existing profile found for user ${userId}, creating new one`)
        // Create a basic profile for this user
        const basicProfile = {
          id: userId,
          email: '', // Will be populated from auth service
          displayName: '', // Will be populated from auth service
          emailVerified: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stats: {
            gamesPlayed: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            streak: 0,
            highestStreak: 0,
            updatedAt: Date.now(),
          },
        }
        return this.handleUserProjection({
          type: 'user/created',
          userId,
          email: basicProfile.email,
          displayName: basicProfile.displayName,
          createdAt: basicProfile.createdAt,
        })
      }

      // Update stats
      const updatedProfile = {
        ...existingProfile,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'user-projection',
          eventType: event.type,
          processedAt: new Date().toISOString(),
        }
      }

      // Update stats if provided
      if (event.gamesPlayed !== undefined) {
        updatedProfile.gamesPlayed = event.gamesPlayed
      }
      if (event.correctAnswers !== undefined) {
        updatedProfile.correctAnswers = event.correctAnswers
      }
      if (event.totalQuestions !== undefined) {
        updatedProfile.totalQuestions = event.totalQuestions
      }
      if (event.streak !== undefined) {
        updatedProfile.streak = event.streak
      }
      if (event.highestStreak !== undefined) {
        updatedProfile.highestStreak = event.highestStreak
      }

      await dbService.saveUserProfile(userId, updatedProfile)
      
      console.log(`✅ [PROJECTION] Stats updated for user ${userId}`)
    } catch (error) {
      console.error(`❌ [PROJECTION] Failed to update stats for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Handle achievement projections
   */
  private async handleAchievementProjection(event: UserEvent): Promise<void> {
    const userId = this.getUserIdFromEvent(event)
    console.log('🔍 [PROJECTION] Handling achievement for user:', userId)
    
    // Implementation would be similar to above
    console.log(`🔍 [PROJECTION] Achievement handling not yet implemented for user ${userId}`)
  }

  /**
   * Handle friend relationship projections
   */
  private async handleFriendProjection(event: UserEvent): Promise<void> {
    const userId = this.getUserIdFromEvent(event)
    console.log('🔍 [PROJECTION] Handling friend relationship for user:', userId)
    
    // Implementation would be similar to above
    console.log(`🔍 [PROJECTION] Friend handling not yet implemented for user ${userId}`)
  }

  /**
   * Handle email verification projections
   */
  private async handleEmailVerifiedProjection(event: UserEmailVerified): Promise<void> {
    const userId = event.userId
    console.log('🔍 [PROJECTION] Handling email verification for user:', userId)

    try {
      // Load existing profile
      const existingProfile = await dbService.loadUserProfile(userId)
      
      if (!existingProfile) {
        console.log(`⚠️ [PROJECTION] No existing profile found for user ${userId}, cannot update email verification`)
        return
      }

      // Update email verification status
      const updatedProfile = {
        ...existingProfile,
        emailVerified: true,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'user-projection',
          eventType: 'user/email-verified',
          processedAt: new Date().toISOString(),
          verifiedAt: new Date(event.verifiedAt).toISOString(),
        }
      }

      await dbService.saveUserProfile(userId, updatedProfile)
      
      console.log(`✅ [PROJECTION] Email verification updated for user ${userId}`)
    } catch (error) {
      console.error(`❌ [PROJECTION] Failed to update email verification for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Handle sync completion projections
   */
  private async handleSyncProjection(event: UserEvent): Promise<void> {
    const userId = this.getUserIdFromEvent(event)
    console.log('🔍 [PROJECTION] Handling sync completion for user:', userId)
    
    // Implementation would be similar to above
    console.log(`🔍 [PROJECTION] Sync handling not yet implemented for user ${userId}`)
  }
}

/**
 * Create and export user projection service instance
 */
export const userProjectionService = new UserProjectionService()

/**
 * Export user projection service type for dependency injection
 */
export type { UserProjectionService as IUserProjectionService }
