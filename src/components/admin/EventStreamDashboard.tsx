/**
 * EventStreamDashboard - Real-time Control Room for SuperAdmin
 * 
 * This is the main dashboard component that provides a live, filterable
 * view of all events happening in the Lexicon Master system. It gives
 * administrators complete visibility into the event-sourced architecture.
 * 
 * Features:
 * - Real-time event stream updates
 * - Advanced filtering and search
 * - Performance metrics and statistics
 * - Export capabilities
 * - Responsive design for monitoring
 */

import { useState, useEffect, useMemo } from 'react'
import { AuditProjection, type AuditLog, type AuditLogEntry } from '../../entities/audit/auditProjectionCore.ts'
import { AuditQueryEngine, type EventFilter, type SortOptions } from '../../entities/audit/auditQueryEngine.ts'
import { useUserClaims } from '../../entities/user/index.ts'
import { useFirebaseAuth } from '../../features/play-round/model/useFirebaseAuth'
import { authService } from '../../services/auth.ts'

/**
 * Dashboard metrics interface
 */
interface DashboardMetrics {
  totalEvents: number
  totalTenants: number
  eventsPerSecond: number
  errorCount: number
  topEventTypes: Array<{ type: string; count: number }>
  topActiveTenants: Array<{ tenantId: string; count: number }>
}

/**
 * EventStreamDashboard Component
 */
export function EventStreamDashboard({ auditProjection }: { auditProjection: AuditProjection }) {
  const { isSuperAdmin } = useUserClaims()
  const { user } = useFirebaseAuth()
  
  const handleLogout = async () => {
    console.log('🚪 [DASHBOARD] Starting logout process')
    try {
      await authService.signOut()
      console.log('✅ [DASHBOARD] Sign-out completed, initiating hard redirect')
      // Force hard redirect to ensure complete app re-initialization
      window.location.href = '/auth'
    } catch (error) {
      console.error('❌ [DASHBOARD] Logout failed:', error)
      // Even if signOut fails, attempt redirect to prevent stuck state
      window.location.href = '/auth'
    }
  }
  
  // Dashboard state
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  
  // Filter state
  const [filter] = useState<EventFilter>({
    limit: 100,
  })
  const [sort] = useState<SortOptions>({
    field: 'timestamp',
    direction: 'desc'
  })
  
  // UI state
  const [searchText, setSearchText] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('')
  const [timeRange, setTimeRange] = useState({ start: '', end: '' })
  const [isExporting, setIsExporting] = useState(false)

  // Initialize audit projection
  useEffect(() => {
    const initializeProjection = () => {
      try {
        auditProjection.start()
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize audit projection:', error)
        setIsLoading(false)
      }
    }

    initializeProjection()

    return () => {
      auditProjection.stop()
    }
  }, [auditProjection])

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return

    const updateInterval = setInterval(() => {
      const currentLog = auditProjection.getAuditLog()
      setAuditLog(currentLog)
    }, 1000) // Update every second

    return () => clearInterval(updateInterval)
  }, [auditProjection, realTimeEnabled])

  // Calculate dashboard metrics
  const metrics = useMemo((): DashboardMetrics => {
    if (!auditLog) {
      return {
        totalEvents: 0,
        totalTenants: 0,
        eventsPerSecond: 0,
        errorCount: 0,
        topEventTypes: [],
        topActiveTenants: []
      }
    }

    const stats = AuditQueryEngine.getEventStatistics(auditLog)
    const errors = AuditQueryEngine.getErrorEvents(auditLog)

    return {
      totalEvents: stats.totalEvents,
      totalTenants: stats.totalTenants,
      eventsPerSecond: stats.eventsPerSecond,
      errorCount: errors.total,
      topEventTypes: stats.topEventTypes,
      topActiveTenants: stats.topActiveTenants
    }
  }, [auditLog])

  // Get filtered events
  const filteredEvents = useMemo(() => {
    if (!auditLog) return { items: [], total: 0, hasMore: false }

    const activeFilter: EventFilter = {
      ...filter,
      searchText: searchText || undefined,
      tenantId: selectedTenant || undefined,
      eventType: selectedEventType || undefined,
      timeRange: (timeRange.start && timeRange.end) ? {
        start: new Date(timeRange.start).getTime(),
        end: new Date(timeRange.end).getTime()
      } : undefined
    }

    return AuditQueryEngine.searchEvents(auditLog, activeFilter, sort)
  }, [auditLog, filter, sort, searchText, selectedTenant, selectedEventType, timeRange])

  // Export functionality
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const events = filteredEvents.items
      
      if (format === 'json') {
        const exportData = JSON.stringify(events, null, 2)
        downloadFile(exportData, `audit-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      } else {
        const csvData = convertToCSV(events)
        downloadFile(csvData, `audit-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Helper functions
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (events: AuditLogEntry[]) => {
    const headers = ['ID', 'Timestamp', 'Tenant ID', 'Event Type', 'Aggregate ID', 'Payload']
    const rows = events.map(event => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.tenantId,
      event.eventType,
      event.aggregateId,
      JSON.stringify(event.payload)
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('failed')) return 'text-red-600 bg-red-100'
    if (eventType.includes('user')) return 'text-blue-600 bg-blue-100'
    if (eventType.includes('game')) return 'text-green-600 bg-green-100'
    if (eventType.includes('village')) return 'text-purple-600 bg-purple-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing audit dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h1>
              <p className="text-sm text-gray-500">Real-time Event Stream Monitor</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome, {user?.displayName} {isSuperAdmin ? '(SuperAdmin)' : ''}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTenants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚡</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Events/Second</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.eventsPerSecond.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Errors</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.errorCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Event Stream Controls</h2>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={realTimeEnabled}
                  onChange={(e) => setRealTimeEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Real-time Updates</span>
              </label>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export JSON'}
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search events..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Tenants</option>
              {metrics.topActiveTenants.map(tenant => (
                <option key={tenant.tenantId} value={tenant.tenantId}>
                  {tenant.tenantId} ({tenant.count} events)
                </option>
              ))}
            </select>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Event Types</option>
              {metrics.topEventTypes.map(type => (
                <option key={type.type} value={type.type}>
                  {type.type} ({type.count} events)
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={timeRange.start}
              onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="datetime-local"
              value={timeRange.end}
              onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Event Stream Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Event Stream 
              <span className="text-sm text-gray-500 ml-2">
                ({filteredEvents.total} total events, showing {filteredEvents.items.length})
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aggregate ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payload
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.items.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.tenantId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.aggregateId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEvents.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No events found matching the current filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
