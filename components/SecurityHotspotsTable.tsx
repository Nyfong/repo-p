import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface SecurityHotspot {
  key: string
  component: string
  project: string
  securityCategory: string
  vulnerabilityProbability: string
  status: string
  line: number
  message: string
  author: string
  creationDate: string
  updateDate: string
  ruleKey: string
  textRange?: {
    startLine: number
    endLine: number
    startOffset: number
    endOffset: number
  }
  flows?: Array<{
    locations: Array<{
      component: string
      textRange: {
        startLine: number
        endLine: number
        startOffset: number
        endOffset: number
      }
      msg?: string
    }>
  }>
}

interface SecurityHotspotsTableProps {
  hotspots: SecurityHotspot[]
}

export default function SecurityHotspotsTable({ hotspots }: SecurityHotspotsTableProps) {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('vulnerabilityProbability')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLTableElement>(null)

  const getFileName = (component: string) => {
    const parts = component.split(':')
    return parts[parts.length - 1] || component
  }

  const filteredHotspots = hotspots
    .filter((hotspot) => {
      if (filterStatus !== 'ALL' && hotspot.status !== filterStatus) {
        return false
      }
      if (filterCategory !== 'ALL' && hotspot.securityCategory !== filterCategory) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'vulnerabilityProbability':
          const probOrder = ['HIGH', 'MEDIUM', 'LOW']
          comparison =
            probOrder.indexOf(a.vulnerabilityProbability) - probOrder.indexOf(b.vulnerabilityProbability)
          break
        case 'line':
          comparison = a.line - b.line
          break
        case 'date':
          comparison =
            new Date(a.creationDate).getTime() -
            new Date(b.creationDate).getTime()
          break
        case 'file':
          comparison = getFileName(a.component).localeCompare(
            getFileName(b.component)
          )
          break
        case 'message':
          comparison = a.message.localeCompare(b.message)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const toggleRowSelection = (hotspotKey: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(hotspotKey)) {
      newSelected.delete(hotspotKey)
    } else {
      newSelected.add(hotspotKey)
    }
    setSelectedRows(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredHotspots.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredHotspots.map((h) => h.key)))
    }
  }

  const toggleRowExpansion = (hotspotKey: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(hotspotKey)) {
      newExpanded.delete(hotspotKey)
    } else {
      newExpanded.add(hotspotKey)
    }
    setExpandedRows(newExpanded)
  }

  const getVulnerabilityColor = (probability: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-600 text-white',
      MEDIUM: 'bg-orange-500 text-white',
      LOW: 'bg-yellow-400 text-gray-900',
    }
    return colors[probability] || 'bg-gray-400 text-white'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      TO_REVIEW: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-green-100 text-green-800',
      SAFE: 'bg-blue-100 text-blue-800',
      FIXED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const uniqueStatuses = Array.from(
    new Set(hotspots.map((h) => h.status))
  ).sort()
  const uniqueCategories = Array.from(
    new Set(hotspots.map((h) => h.securityCategory))
  ).sort()

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return (
      <span className="ml-1 text-gray-500 text-xs">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by:
              </label>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-36 h-9 text-sm border-gray-300 rounded-md"
              >
                <option value="ALL">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-40 h-9 text-sm border-gray-300 rounded-md"
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            <div className="text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <span className="font-medium">{filteredHotspots.length}</span> of{' '}
              <span className="font-medium">{hotspots.length}</span> hotspots
            </div>
          </div>
        </div>
      </div>

      {/* Professional Table */}
      <div className="overflow-x-auto">
        <table
          ref={tableRef}
          className="w-full border-collapse"
        >
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 sticky left-0 z-10 border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={
                    filteredHotspots.length > 0 &&
                    selectedRows.size === filteredHotspots.length
                  }
                  onChange={toggleAllSelection}
                  className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[120px]"
                onClick={() => handleSort('vulnerabilityProbability')}
              >
                <div className="flex items-center gap-1">
                  Risk Level
                  <SortIcon column="vulnerabilityProbability" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[100px]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon column="status" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 min-w-[150px]"
              >
                Category
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[350px]"
                onClick={() => handleSort('message')}
              >
                <div className="flex items-center gap-1">
                  Message
                  <SortIcon column="message" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[180px]"
                onClick={() => handleSort('file')}
              >
                <div className="flex items-center gap-1">
                  File
                  <SortIcon column="file" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[70px]"
                onClick={() => handleSort('line')}
              >
                <div className="flex items-center gap-1">
                  Line
                  <SortIcon column="line" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 min-w-[120px]">
                Rule
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 min-w-[100px]">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 min-w-[80px]">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredHotspots.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-12 text-center text-gray-500 bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">No security hotspots found</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredHotspots.map((hotspot, index) => {
                const isSelected = selectedRows.has(hotspot.key)
                const isExpanded = expandedRows.has(hotspot.key)
                const rowClass = isSelected
                  ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50 transition-colors'

                return (
                  <React.Fragment key={hotspot.key}>
                    <tr className={rowClass}>
                      <td className="px-3 py-3 whitespace-nowrap text-sm sticky left-0 z-10 bg-inherit border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(hotspot.key)}
                          className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          className={`${getVulnerabilityColor(hotspot.vulnerabilityProbability)} text-xs font-medium px-2 py-0.5`}
                        >
                          {hotspot.vulnerabilityProbability}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(hotspot.status)} text-xs px-2 py-0.5`}
                        >
                          {hotspot.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {hotspot.securityCategory}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={hotspot.message}>
                          {hotspot.message}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-mono text-xs text-gray-700" title={hotspot.component}>
                          {getFileName(hotspot.component)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                        {hotspot.line}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={hotspot.ruleKey}>
                          {hotspot.ruleKey}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(hotspot.creationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <Button
                          onClick={() => toggleRowExpansion(hotspot.key)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={10} className="px-6 py-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-gray-700">Full Path:</span>
                                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
                                  {hotspot.component}
                                </code>
                              </div>
                              {hotspot.textRange && (
                                <div>
                                  <span className="font-semibold text-gray-700">Text Range:</span>
                                  <span className="ml-2 text-gray-600">
                                    Line {hotspot.textRange.startLine}
                                    {hotspot.textRange.startLine !== hotspot.textRange.endLine && (
                                      <span> - {hotspot.textRange.endLine}</span>
                                    )}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-700">Last Updated:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(hotspot.updateDate).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {hotspot.author && (
                                <div>
                                  <span className="font-semibold text-gray-700">Author:</span>
                                  <span className="ml-2 text-gray-600">{hotspot.author}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-700">Project:</span>
                                <span className="ml-2 text-gray-600">{hotspot.project}</span>
                              </div>
                            </div>
                            {hotspot.flows && hotspot.flows.length > 0 && (
                              <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-700">Code Flows ({hotspot.flows.length}):</span>
                                <div className="mt-2 space-y-2">
                                  {hotspot.flows.map((flow, flowIdx) => (
                                    <div
                                      key={flowIdx}
                                      className="bg-white p-3 rounded-lg border border-gray-200"
                                    >
                                      {flow.locations.map((location, locIdx) => (
                                        <div key={locIdx} className="text-sm text-gray-700 mb-1 last:mb-0">
                                          <span className="font-mono text-xs text-gray-600">
                                            {getFileName(location.component)}:{location.textRange.startLine}
                                          </span>
                                          {location.msg && (
                                            <span className="text-gray-500 ml-2 text-xs">
                                              {location.msg}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

