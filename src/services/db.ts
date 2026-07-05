import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { getFirestoreDB } from '@/shared/api/firebase'
import type { EventLog } from '@/shared/event-sourcing'
import { encryptUserProfile, decryptUserProfile, encryptEventLog, decryptEventLog } from '@/shared/lib/security/cryptoShreddingBrowser'

/**
 * Database service for Firestore operations
 * Handles event log persistence and user data storage
 */
export interface DatabaseService {
  /** Save event log for a user */
  saveEventLog(userId: string, matchId: string, eventLog: EventLog<any>): Promise<void>
  
  /** Load event log for a user */
  loadEventLog(userId: string, matchId: string): Promise<EventLog<any> | null>
  
  /** Get all event logs for a user */
  getUserEventLogs(userId: string): Promise<EventLog<any>[]>
  
  /** Save user profile data */
  saveUserProfile(userId: string, profile: any): Promise<void>
  
  /** Load user profile data */
  loadUserProfile(userId: string): Promise<any | null>
  
  /** Sync events to remote */
  syncEvents(userId: string, events: any[]): Promise<void>
  
  /** Get friend activity */
  getFriendActivity(friendIds: string[]): Promise<any[]>
}

/**
 * Firestore implementation of DatabaseService
 */
class FirestoreDBService implements DatabaseService {
  private db = getFirestoreDB()

  async saveEventLog(userId: string, matchId: string, eventLog: EventLog<any>): Promise<void> {
    try {
      const eventLogRef = doc(this.db, 'users', userId, 'matches', matchId)
      
      // Encrypt sensitive data in event log before saving
      const encryptedEventLog = await encryptEventLog({
        matchId: eventLog.matchId,
        createdAt: eventLog.createdAt,
        events: [...eventLog.events] // Convert readonly to mutable
      })
      
      // Convert to Firestore-compatible format
      const firestoreLog = {
        ...encryptedEventLog,
        updatedAt: serverTimestamp(),
        events: encryptedEventLog.events.map((event: any) => ({
          ...event,
          timestamp: Timestamp.fromMillis(event.timestamp),
        })),
      }
      
      await setDoc(eventLogRef, firestoreLog)
      console.log(`Encrypted event log saved for user ${userId}, match ${matchId}`)
    } catch (error) {
      console.error('Failed to save event log:', error)
      throw error
    }
  }

  async loadEventLog(userId: string, matchId: string): Promise<EventLog<any> | null> {
    try {
      const eventLogRef = doc(this.db, 'users', userId, 'matches', matchId)
      const snapshot = await getDoc(eventLogRef)
      
      if (!snapshot.exists()) {
        return null
      }
      
      const data = snapshot.data()
      
      // Convert from Firestore format back to EventLog
      const eventLog: EventLog<any> = {
        matchId: data.matchId,
        createdAt: data.createdAt,
        events: data.events.map((event: any) => ({
          ...event,
          timestamp: event.timestamp.toMillis(),
        })),
      }
      
      return eventLog
    } catch (error) {
      console.error('Failed to load event log:', error)
      throw error
    }
  }

  async getUserEventLogs(userId: string): Promise<EventLog<any>[]> {
    try {
      const matchesRef = collection(this.db, 'users', userId, 'matches')
      const snapshot = await getDocs(matchesRef)
      
      const eventLogs: EventLog<any>[] = []
      
      for (const doc of snapshot.docs) {
        const data = doc.data()
        
        // Decrypt event log data
        const decryptedEventLog = await decryptEventLog(data)
        
        const eventLog: EventLog<any> = {
          matchId: decryptedEventLog.matchId,
          createdAt: decryptedEventLog.createdAt,
          events: decryptedEventLog.events.map((event: any) => ({
            ...event,
            timestamp: event.timestamp.toMillis(),
          })),
        }
        eventLogs.push(eventLog)
      }
      
      return eventLogs.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('Failed to get user event logs:', error)
      throw error
    }
  }

  async saveUserProfile(userId: string, profile: any): Promise<void> {
    try {
      const profileRef = doc(this.db, 'users', userId, 'profile')
      
      // Encrypt sensitive profile data before saving
      const encryptedProfile = await encryptUserProfile(profile)
      
      const profileData = {
        ...encryptedProfile,
        updatedAt: serverTimestamp(),
      }
      
      await setDoc(profileRef, profileData, { merge: true })
      console.log(`Encrypted profile saved for user ${userId}`)
    } catch (error) {
      console.error('Failed to save user profile:', error)
      throw error
    }
  }

  async loadUserProfile(userId: string): Promise<any | null> {
    try {
      const profileRef = doc(this.db, 'users', userId, 'profile')
      const snapshot = await getDoc(profileRef)
      
      if (!snapshot.exists()) {
        return null
      }
      
      const encryptedProfile = snapshot.data()
      
      // Decrypt sensitive profile data
      return await decryptUserProfile(encryptedProfile)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      throw error
    }
  }

  async syncEvents(userId: string, events: any[]): Promise<void> {
    try {
      // This would be implemented with a more sophisticated sync strategy
      // For now, just save to a sync log collection
      const syncRef = doc(this.db, 'users', userId, 'sync', 'events')
      
      await setDoc(syncRef, {
        events,
        syncedAt: serverTimestamp(),
      })
      
      console.log(`Synced ${events.length} events for user ${userId}`)
    } catch (error) {
      console.error('Failed to sync events:', error)
      throw error
    }
  }

  async getFriendActivity(friendIds: string[]): Promise<any[]> {
    try {
      if (friendIds.length === 0) {
        return []
      }
      
      // Query recent matches from all friends
      const activities: any[] = []
      
      for (const friendId of friendIds) {
        const matchesRef = collection(this.db, 'users', friendId, 'matches')
        const q = query(
          matchesRef,
          where('updatedAt', '>', Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))), // Last 7 days
          orderBy('updatedAt', 'desc'),
          limit(5)
        )
        
        const snapshot = await getDocs(q)
        
        snapshot.forEach(doc => {
          const data = doc.data()
          activities.push({
            userId: friendId,
            matchId: data.matchId,
            updatedAt: data.updatedAt.toMillis(),
            eventCount: data.events.length,
          })
        })
      }
      
      return activities.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('Failed to get friend activity:', error)
      throw error
    }
  }
}

/**
 * Create and export database service instance
 */
export const dbService = new FirestoreDBService()

/**
 * Export database service type for dependency injection
 */
export type { DatabaseService as IDatabaseService }
