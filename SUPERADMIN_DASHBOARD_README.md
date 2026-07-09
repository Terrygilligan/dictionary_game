# SuperAdmin Dashboard - Real-time Event Stream Monitor

## Overview

The SuperAdmin Dashboard provides comprehensive real-time audit visibility into the Lexicon Master event-sourced system. It serves as a "control room" for administrators to monitor every action happening across all tenants in real-time.

## Architecture

### Event-Driven Design
The dashboard follows the same event-sourcing principles as the core application:

- **Read-Only Projection**: Never interferes with the write path
- **Event Bus Subscription**: Subscribes to all system events in real-time
- **Multi-Tenant Isolation**: Maintains tenant separation while providing unified view
- **Immutable Audit Log**: Complete audit trail of all system events

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SuperAdmin Dashboard                     │
├─────────────────────────────────────────────────────────────┤
│  AdminGuard (Authentication & Authorization)                │
│  ├── MockAuthProvider (Development)                         │
│  ├── Role-based access control                              │
│  └── Firebase-ready (production)                            │
├─────────────────────────────────────────────────────────────┤
│  EventStreamDashboard (UI Layer)                            │
│  ├── Real-time metrics display                              │
│  ├── Advanced filtering and search                          │
│  ├── Export functionality                                   │
│  └── Responsive design                                      │
├─────────────────────────────────────────────────────────────┤
│  AuditProjection (Core Engine)                              │
│  ├── EventBus subscription                                  │
│  ├── In-memory audit log                                   │
│  ├── Performance-optimized indexing                        │
│  └── Configurable limits                                    │
├─────────────────────────────────────────────────────────────┤
│  AuditQueryEngine (Selectors)                               │
│  ├── High-performance queries                               │
│  ├── Flexible filtering                                     │
│  ├── Pagination support                                    │
│  └── Statistics calculation                                 │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 🔍 Real-Time Event Monitoring
- **Live Event Stream**: See events as they happen across all tenants
- **Event Type Classification**: Color-coded events by type (user, game, village, errors)
- **Performance Metrics**: Events per second, tenant activity, error rates
- **Historical Analysis**: Time-based filtering and trend analysis

### 🎛️ Advanced Filtering
- **Tenant Filtering**: Isolate events by specific tenant
- **Event Type Filtering**: Filter by specific event types or patterns
- **Time Range Selection**: Analyze events within custom time windows
- **Full-Text Search**: Search across event payloads and metadata

### 📊 Dashboard Analytics
- **System Health Metrics**: Real-time performance indicators
- **Top Event Types**: Most frequent event types with counts
- **Active Tenants**: Tenant activity ranking
- **Error Monitoring**: Dedicated error tracking and alerting

### 💾 Export Capabilities
- **JSON Export**: Structured data export for analysis
- **CSV Export**: Spreadsheet-compatible format
- **Custom Date Ranges**: Export specific time periods
- **Bulk Data Export**: Large dataset handling

### 🔐 Security & Access Control
- **Role-Based Authentication**: Admin/SuperAdmin access levels
- **Mock Authentication**: Development-ready auth system
- **Firebase Integration**: Production-ready with custom claims
- **Session Management**: Secure session handling

## Quick Start

### 1. Access the Dashboard

```typescript
// Navigate to the SuperAdmin Dashboard
// URL: /admin

// Test credentials (development):
// Email: admin@lexiconmaster.com
// Password: admin123
```

### 2. Monitor Events in Real-Time

The dashboard automatically starts receiving events when loaded:

1. **Metrics Overview**: View system statistics at the top
2. **Event Stream**: Scroll through live events in the main table
3. **Filter Events**: Use the control panel to filter by tenant, type, or time
4. **Search**: Use the search bar for full-text event search

### 3. Export Event Data

```typescript
// Export current filtered view
await dashboard.exportEvents('json') // or 'csv'
```

## Implementation Details

### Audit Projection Core

```typescript
// Create audit projection
const auditProjection = createAuditProjection(eventBus, {
  maxEvents: 10000,        // Maximum events in memory
  maxRecentEvents: 1000,   // Recent events cache
  debug: true              // Enable debug logging
})

// Start monitoring
auditProjection.start()
```

### Query Engine Usage

```typescript
// Get recent events
const recentEvents = AuditQueryEngine.getRecentEvents(auditLog, 100)

// Filter by tenant
const tenantEvents = AuditQueryEngine.getEventsByTenant(auditLog, 'tenant-123')

// Search with filters
const searchResults = AuditQueryEngine.searchEvents(auditLog, {
  tenantId: 'tenant-123',
  eventType: 'user/*',
  timeRange: { start: Date.now() - 3600000, end: Date.now() },
  limit: 50
})
```

### Authentication Integration

```typescript
// Mock authentication (development)
const auth = useMockAuth()

// Production with Firebase
const auth = useFirebaseAuth()

// Role-based access control
<AdminGuard requiredRole="admin">
  <EventStreamDashboard auditProjection={auditProjection} />
</AdminGuard>
```

## Configuration

### Audit Projection Configuration

```typescript
interface AuditProjectionConfig {
  maxEvents?: number          // Default: 10000
  maxRecentEvents?: number    // Default: 1000
  eventsPerSecondWindow?: number // Default: 60000ms
  debug?: boolean            // Default: false
}
```

### Performance Tuning

- **Memory Usage**: Adjust `maxEvents` based on available memory
- **Real-Time Updates**: Configure update intervals for dashboard
- **Indexing**: Pre-computed indexes for fast queries
- **Caching**: LRU cache for recent events

## Event Types Supported

### Game Events
- `game/started` - New game session
- `answer/submitted` - User answer submitted
- `round/advanced` - Game round progression
- `streak/updated` - Answer streak changes
- `game/finished` - Game session completed
- `difficulty/adjusted` - AI difficulty adjustments
- `audio/*` - Audio processing events

### User Events
- `user/registered` - New user registration
- `user/authenticated` - User login
- `profile/updated` - Profile changes
- `achievement/unlocked` - Achievement earned
- `friend/*` - Social interactions

### Village Events
- `village/created` - New village creation
- `village/stats-updated` - Village statistics

### Error Events
- `audio/generation-failed` - Audio processing errors
- `user/registration-failed` - Registration failures
- `/*/*failed` - General failure events

## Development Guide

### Adding New Event Types

```typescript
// 1. Update event type classification
const getEventTypeColor = (eventType: string) => {
  if (eventType.includes('your-event-type')) {
    return 'text-purple-600 bg-purple-100'
  }
  // ... existing logic
}

// 2. Add to mock event generator
const eventTypes = [
  // ... existing events
  { type: 'your-event-type', tenant: 'your-tenant', aggregate: 'your-aggregate' }
]
```

### Custom Queries

```typescript
// Add custom selector to AuditQueryEngine
static getCustomEvents(auditLog: AuditLog, customFilter: CustomFilter): QueryResult<AuditLogEntry> {
  // Implement custom query logic
}
```

### UI Customization

```typescript
// Add new metric card
<div className="bg-white p-6 rounded-lg shadow">
  <div className="flex items-center">
    <div className="flex-shrink-0">
      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
        <span className="text-white text-sm font-bold">📈</span>
      </div>
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-500">Custom Metric</p>
      <p className="text-2xl font-bold text-gray-900">{customValue}</p>
    </div>
  </div>
</div>
```

## Production Deployment

### Firebase Authentication Setup

```typescript
// Replace MockAuthProvider with FirebaseAuthProvider
import { FirebaseAuthProvider } from './FirebaseAuthProvider'

// Update AdminGuard to use Firebase custom claims
const user = useFirebaseUser()
const isAdmin = user?.claims?.admin === true
```

### Performance Considerations

1. **Memory Management**: Monitor memory usage with large event volumes
2. **Database Integration**: Consider persistent storage for historical data
3. **Scaling**: Horizontal scaling for multi-instance deployments
4. **Monitoring**: Add performance monitoring and alerting

### Security Hardening

1. **Input Validation**: Validate all filter inputs
2. **Rate Limiting**: Implement API rate limiting
3. **Audit Logging**: Log all dashboard access
4. **Network Security**: HTTPS and secure headers

## Troubleshooting

### Common Issues

**Events not appearing:**
- Check EventBus subscription
- Verify event types are supported
- Ensure real-time updates are enabled

**Performance issues:**
- Reduce `maxEvents` configuration
- Enable time-based filtering
- Check memory usage

**Authentication problems:**
- Verify user roles and permissions
- Check Firebase custom claims
- Clear browser cache and cookies

### Debug Mode

```typescript
// Enable debug logging
const auditProjection = createAuditProjection(eventBus, {
  debug: true
})

// Monitor console for debug output
console.log('[AuditProjection]', 'Debug information')
```

## API Reference

### AuditProjection Class

```typescript
class AuditProjection {
  start(): void
  stop(): void
  getAuditLog(): AuditLog
}
```

### AuditQueryEngine Class

```typescript
class AuditQueryEngine {
  static getEventsByTenant(auditLog: AuditLog, tenantId: string): QueryResult<AuditLogEntry>
  static getRecentEvents(auditLog: AuditLog, limit: number): QueryResult<AuditLogEntry>
  static searchEvents(auditLog: AuditLog, filter: EventFilter): QueryResult<AuditLogEntry>
  static getEventsByType(auditLog: AuditLog, eventType: string): QueryResult<AuditLogEntry>
  static getErrorEvents(auditLog: AuditLog): QueryResult<AuditLogEntry>
}
```

### EventStreamDashboard Component

```typescript
interface EventStreamDashboardProps {
  auditProjection: AuditProjection
}
```

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Navigate to `/admin` to access the dashboard
4. Use test credentials for authentication

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## License

This implementation follows the Lexicon Master architectural guidelines and maintains compliance with the Event-Driven Architecture Blueprint.

---

**Note**: This is a comprehensive SuperAdmin Dashboard implementation that provides real-time audit visibility while maintaining the architectural principles of the Lexicon Master event-sourced system.
