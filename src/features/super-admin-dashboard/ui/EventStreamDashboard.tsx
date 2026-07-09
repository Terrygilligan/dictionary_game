import { useEffect, useState } from 'react'
import type { AuditEvent, SystemMetrics } from '../../../entities/audit/model/index.ts'
import type { AuditStore } from '../model/auditStore.ts'
import { useAuditStore } from '../hooks/useAuditStore.ts'

interface EventStreamDashboardProps {
  auditStore: AuditStore
}

export function EventStreamDashboard({ auditStore }: EventStreamDashboardProps) {
  const { state, start, stop, queryEvents, exportEvents, getMetrics } = useAuditStore(auditStore)
  const [filter, setFilter] = useState({
    tenant_id: '',
    aggregate_type: '',
    event_type: '',
    start_time: '',
    end_time: '',
  })
  const [events, setEvents] = useState<readonly AuditEvent[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    // Start the audit projection when component mounts
    start()
    
    return () => {
      // Cleanup when component unmounts
      stop()
    }
  }, [start, stop])

  useEffect(() => {
    // Update events when state changes
    const filterParams = {
      ...(filter.tenant_id && { tenant_id: filter.tenant_id }),
      ...(filter.aggregate_type && { aggregate_type: filter.aggregate_type }),
      ...(filter.event_type && { event_type: filter.event_type }),
      ...(filter.start_time && { start_time: new Date(filter.start_time).getTime() }),
      ...(filter.end_time && { end_time: new Date(filter.end_time).getTime() }),
      limit: 100,
    }
    
    setEvents(queryEvents(filterParams))
    setMetrics(getMetrics())
  }, [state, filter, queryEvents, getMetrics])

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const exportFilter = {
        start_time: filter.start_time ? new Date(filter.start_time).getTime() : Date.now() - 86400000, // Last 24 hours
        end_time: filter.end_time ? new Date(filter.end_time).getTime() : Date.now(),
      }
      
      const exportData = await exportEvents(exportFilter, format)
      
      // Create download
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (state.is_loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading audit dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
        <div className="flex gap-2">
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

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
            <p className="text-2xl font-bold">{formatNumber(metrics.total_events)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Active Tenants</h3>
            <p className="text-2xl font-bold">{formatNumber(metrics.active_tenants)}</p>
            <p className="text-xs text-gray-500">of {formatNumber(metrics.total_tenants)} total</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
            <p className="text-2xl font-bold">{(metrics.error_rate * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Events/Second</h3>
            <p className="text-2xl font-bold">{metrics.events_per_second.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Tenant ID"
            value={filter.tenant_id}
            onChange={(e) => setFilter({ ...filter, tenant_id: e.target.value })}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filter.aggregate_type}
            onChange={(e) => setFilter({ ...filter, aggregate_type: e.target.value })}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Aggregate Types</option>
            <option value="user">User</option>
            <option value="game">Game</option>
            <option value="village">Village</option>
          </select>
          <input
            type="text"
            placeholder="Event Type"
            value={filter.event_type}
            onChange={(e) => setFilter({ ...filter, event_type: e.target.value })}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={filter.start_time}
            onChange={(e) => setFilter({ ...filter, start_time: e.target.value })}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="datetime-local"
            value={filter.end_time}
            onChange={(e) => setFilter({ ...filter, end_time: e.target.value })}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Event Stream */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Event Stream</h2>
          <p className="text-sm text-gray-500">
            Showing {events.length} most recent events
            {state.subscription_active && ' • Live updates enabled'}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aggregate</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{formatTimestamp(event.timestamp)}</td>
                  <td className="px-4 py-2 text-sm font-mono text-xs">{event.tenant_id}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.aggregate_type === 'user' ? 'bg-blue-100 text-blue-800' :
                      event.aggregate_type === 'game' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {event.aggregate_type}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-xs">{event.event_type}</td>
                  <td className="px-4 py-2 text-sm font-mono text-xs">{event.aggregate_id}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{event.sequence}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events found matching the current filters
            </div>
          )}
        </div>
      </div>

      {/* Top Event Types */}
      {metrics?.top_event_types && metrics.top_event_types.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-4">Top Event Types</h2>
          <div className="space-y-2">
            {metrics.top_event_types.slice(0, 5).map((eventType) => (
              <div key={eventType.event_type} className="flex justify-between items-center">
                <span className="text-sm font-mono">{eventType.event_type}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{formatNumber(eventType.count)} events</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(eventType.count / metrics.total_events) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
