/**
 * SuperAdmin Dashboard Page - Complete Integration
 * 
 * This page integrates all the audit components to provide a complete
 * SuperAdmin Dashboard experience. It sets up the audit projection,
 * handles authentication, and renders the event stream dashboard.
 * 
 * This is the main entry point for the SuperAdmin Dashboard feature.
 */

import React, { useEffect, useState } from 'react'
import { createEventBus } from '../../shared/event-bus/index.ts'
import { AuditProjection, createAuditProjection } from '../../entities/audit/auditProjectionCore.ts'
import { EventStreamDashboard } from '../../components/admin/EventStreamDashboard.tsx'
import { AdminGuard, MockAuthProvider } from '../../components/admin/AdminGuard.tsx'
import type { GameEvent } from '../../entities/game/model/events.ts'
import type { UserEvent } from '../../entities/user/model/events.ts'
import type { VillageEvent } from '../../entities/village/model/events.ts'

/**
 * Mock event generator for testing the dashboard
 * In production, this would be replaced by real events from the system
 */
class MockEventGenerator {
  private eventBus: ReturnType<typeof createEventBus<GameEvent | UserEvent | VillageEvent>>
  private intervalId: NodeJS.Timeout | null = null

  constructor(eventBus: ReturnType<typeof createEventBus<GameEvent | UserEvent | VillageEvent>>) {
    this.eventBus = eventBus
  }

  start() {
    // Generate mock events every 2 seconds
    this.intervalId = setInterval(() => {
      this.generateMockEvent()
    }, 2000)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private generateMockEvent() {
    const eventTypes = [
      // Game events
      { type: 'game/started', tenant: 'game-tenant-1', aggregate: 'game-123' },
      { type: 'answer/submitted', tenant: 'game-tenant-1', aggregate: 'game-123' },
      { type: 'round/advanced', tenant: 'game-tenant-2', aggregate: 'game-456' },
      { type: 'streak/updated', tenant: 'game-tenant-1', aggregate: 'game-123' },
      { type: 'game/finished', tenant: 'game-tenant-2', aggregate: 'game-456' },
      
      // User events
      { type: 'user/registered', tenant: 'user-123', aggregate: 'user-123' },
      { type: 'user/authenticated', tenant: 'user-456', aggregate: 'user-456' },
      { type: 'profile/updated', tenant: 'user-123', aggregate: 'user-123' },
      { type: 'achievement/unlocked', tenant: 'user-789', aggregate: 'user-789' },
      
      // Village events
      { type: 'village/created', tenant: 'village-1', aggregate: 'village-1' },
      { type: 'village/stats-updated', tenant: 'village-1', aggregate: 'village-1' },
      
      // Error events (for testing error monitoring)
      { type: 'audio/generation-failed', tenant: 'game-tenant-1', aggregate: 'game-123' },
      { type: 'user/registration-failed', tenant: 'user-999', aggregate: 'user-999' },
    ]

    const randomIndex = Math.floor(Math.random() * eventTypes.length)
    const randomEvent = eventTypes[randomIndex]
    
    if (!randomEvent) {
      return
    }
    
    // Create mock event based on type
    let mockEvent: GameEvent | UserEvent | VillageEvent

    switch (randomEvent.type) {
      case 'game/started':
        mockEvent = {
          type: 'game/started',
          tenant_id: randomEvent.tenant,
          aggregate_id: randomEvent.aggregate,
          deck: []
        } as GameEvent
        break
      
      case 'answer/submitted':
        mockEvent = {
          type: 'answer/submitted',
          tenant_id: randomEvent.tenant,
          aggregate_id: randomEvent.aggregate,
          roundIndex: Math.floor(Math.random() * 10),
          choiceId: `choice-${Math.floor(Math.random() * 4)}`,
          correct: Math.random() > 0.3
        } as GameEvent
        break
      
      case 'user/registered':
        mockEvent = {
          type: 'user/registered',
          userId: randomEvent.aggregate,
          email: `user${randomEvent.aggregate}@example.com`,
          displayName: `User ${randomEvent.aggregate}`,
          emailVerified: true,
          createdAt: Date.now()
        } as UserEvent
        break
      
      case 'village/created':
        mockEvent = {
          type: 'village/created',
          villageId: randomEvent.aggregate,
          name: `Village ${randomEvent.aggregate}`,
          description: `Description for village ${randomEvent.aggregate}`,
          createdBy: randomEvent.tenant,
          createdAt: Date.now()
        } as unknown as VillageEvent
        break
      
      default:
        // Generic event for other types
        mockEvent = {
          type: randomEvent.type as any,
          tenant_id: randomEvent.tenant,
          aggregate_id: randomEvent.aggregate,
          timestamp: Date.now()
        } as any
        break
    }

    // Publish the event to the bus
    this.eventBus.publish(mockEvent)
  }
}

/**
 * SuperAdmin Dashboard Page Component
 */
export function SuperAdminDashboardPage() {
  const [auditProjection, setAuditProjection] = useState<AuditProjection | null>(null)
  const [eventGenerator, setEventGenerator] = useState<MockEventGenerator | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Create event bus for the audit projection
        const eventBus = createEventBus<GameEvent | UserEvent | VillageEvent>()
        
        // Create audit projection
        const projection = createAuditProjection(eventBus, {
          maxEvents: 5000,
          maxRecentEvents: 500,
          debug: true
        })
        
        // Create mock event generator for testing
        const generator = new MockEventGenerator(eventBus)
        
        setAuditProjection(projection)
        setEventGenerator(generator)
        setIsInitialized(true)
        
        console.log('✅ SuperAdmin Dashboard initialized successfully')
        
      } catch (error) {
        console.error('❌ Failed to initialize SuperAdmin Dashboard:', error)
      }
    }

    initializeDashboard()

    return () => {
      // Cleanup
      if (eventGenerator) {
        eventGenerator.stop()
      }
      if (auditProjection) {
        auditProjection.stop()
      }
    }
  }, [])

  // Start mock event generation when initialized
  useEffect(() => {
    if (isInitialized && eventGenerator) {
      eventGenerator.start()
      
      return () => {
        eventGenerator.stop()
      }
    }
  }, [isInitialized, eventGenerator])

  if (!isInitialized || !auditProjection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SuperAdmin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <MockAuthProvider>
      <AdminGuard requiredRole="admin">
        <EventStreamDashboard auditProjection={auditProjection} />
      </AdminGuard>
    </MockAuthProvider>
  )
}

/**
 * Development helper component for testing the dashboard
 * This can be used in development to quickly test the dashboard
 */
export function DevSuperAdminDashboard() {
  return (
    <div className="p-4">
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Development Mode</h3>
        <p className="text-yellow-700">
          This is the development version of the SuperAdmin Dashboard.
          Mock events are being generated for testing purposes.
        </p>
        <p className="text-sm text-yellow-600 mt-2">
          Test credentials: admin@lexiconmaster.com / admin123
        </p>
      </div>
      <SuperAdminDashboardPage />
    </div>
  )
}
