import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Issue {
  key: string
  rule: string
  severity: string
  component: string
  project: string
  line: number
  hash: string
  textRange: {
    startLine: number
    endLine: number
    startOffset: number
    endOffset: number
  }
  flows: Flow[]
  status: string
  message: string
  effort: string
  debt: string
  author: string
  tags: string[]
  creationDate: string
  updateDate: string
  type: string
  scope: string
  quickFixAvailable: boolean
  messageFormattings: any[]
  codeVariants: any[]
  cleanCodeAttribute: string
  cleanCodeAttributeCategory: string
  impacts: Impact[]
  issueStatus: string
  prioritizedRule: boolean
  fromSonarQubeUpdate: boolean
  internalTags: any[]
  linkedTicketStatus: string
}

interface Flow {
  locations: Location[]
}

interface Location {
  component: string
  textRange: {
    startLine: number
    endLine: number
    startOffset: number
    endOffset: number
  }
  msg: string
  msgFormattings: any[]
}

interface Impact {
  softwareQuality: string
  severity: string
}

interface IssuesTableProps {
  issues: Issue[]
}

export default function IssuesTable({ issues }: IssuesTableProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('severity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const tableRef = useRef<HTMLTableElement>(null)

  const getFileName = (component: string) => {
    const parts = component.split(':')
    return parts[parts.length - 1] || component
  }

  const filteredIssues = issues
    .filter((issue) => {
      if (filterSeverity !== 'ALL' && issue.severity !== filterSeverity) {
        return false
      }
      if (filterType !== 'ALL' && issue.type !== filterType) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'severity':
          const severityOrder = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']
          comparison =
            severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
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
      setSortOrder('asc')
    }
  }

  const toggleRowSelection = (issueKey: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(issueKey)) {
      newSelected.delete(issueKey)
    } else {
      newSelected.add(issueKey)
    }
    setSelectedRows(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredIssues.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredIssues.map((i) => i.key)))
    }
  }

  const toggleRowExpansion = (issueKey: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(issueKey)) {
      newExpanded.delete(issueKey)
    } else {
      newExpanded.add(issueKey)
    }
    setExpandedRows(newExpanded)
  }

  const exportToExcel = async (groupBySeverity: boolean = false) => {
    try {
      const filename = groupBySeverity
        ? `sonarqube-issues-by-severity-${new Date().toISOString().split('T')[0]}.xlsx`
        : `sonarqube-issues-${new Date().toISOString().split('T')[0]}.xlsx`
      
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: filteredIssues,
          filename,
          groupBySeverity,
        }),
      })

      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || error.details || 'Export failed')
        } else {
          // If not JSON, it's probably an HTML error page
          const text = await response.text()
          throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`)
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure xlsx package is installed: npm install xlsx`)
      console.error('Excel export error:', error)
    }
  }

  const exportSelectedToExcel = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one row to export')
      return
    }

    try {
      const selectedIssues = filteredIssues.filter((issue) =>
        selectedRows.has(issue.key)
      )
      const filename = `sonarqube-selected-issues-${new Date().toISOString().split('T')[0]}.xlsx`
      
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: selectedIssues,
          filename,
        }),
      })

      if (!response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || error.details || 'Export failed')
        } else {
          // If not JSON, it's probably an HTML error page
          const text = await response.text()
          throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`)
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure xlsx package is installed: npm install xlsx`)
      console.error('Excel export error:', error)
    }
  }

  const exportToWord = async () => {
    try {
      const filename = `sonarqube-issues-${new Date().toISOString().split('T')[0]}.doc`
      
      const response = await fetch('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: filteredIssues,
          filename,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || error.details || 'Export failed')
        } else {
          const text = await response.text()
          throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`)
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Word export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Word export error:', error)
    }
  }

  const exportSelectedToWord = async () => {
    if (selectedRows.size === 0) {
      alert('Please select at least one row to export')
      return
    }

    try {
      const selectedIssues = filteredIssues.filter((issue) =>
        selectedRows.has(issue.key)
      )
      const filename = `sonarqube-selected-issues-${new Date().toISOString().split('T')[0]}.doc`
      
      const response = await fetch('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: selectedIssues,
          filename,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || error.details || 'Export failed')
        } else {
          const text = await response.text()
          throw new Error(`Server error (${response.status}): ${text.substring(0, 100)}`)
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Word export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Word export error:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      BLOCKER: 'bg-red-900 text-white',
      CRITICAL: 'bg-red-600 text-white',
      MAJOR: 'bg-orange-500 text-white',
      MINOR: 'bg-yellow-400 text-gray-900',
      INFO: 'bg-blue-400 text-white',
    }
    return colors[severity] || 'bg-gray-400 text-white'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      CONFIRMED: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const uniqueSeverities = Array.from(
    new Set(issues.map((i) => i.severity))
  ).sort()
  const uniqueTypes = Array.from(new Set(issues.map((i) => i.type))).sort()
  
  // Format type names for better display
  const formatTypeName = (type: string) => {
    // Convert VULNERABILITY, CODE_SMELL, BUG to readable format
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

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
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-36 h-9 text-sm border-gray-300 rounded-md"
              >
                <option value="ALL">All Severities</option>
                {uniqueSeverities.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </Select>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-40 h-9 text-sm border-gray-300 rounded-md"
              >
                <option value="ALL">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatTypeName(type)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="text-sm text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
              <span className="font-medium">{filteredIssues.length}</span> of{' '}
              <span className="font-medium">{issues.length}</span> issues
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedRows.size > 0 && (
              <div className="text-xs text-gray-500 mr-2">
                {selectedRows.size} selected
              </div>
            )}
            <div className="flex gap-2 border-l pl-3">
              <Button
                onClick={() => exportToExcel(false)}
                size="sm"
                variant="outline"
                className="text-xs h-8"
                title="Export all issues to Excel"
              >
                Export Excel
              </Button>
              <Button
                onClick={() => exportToExcel(true)}
                size="sm"
                variant="outline"
                className="text-xs h-8"
                title="Export grouped by severity"
              >
                Excel by Severity
              </Button>
              <Button
                onClick={exportToWord}
                size="sm"
                variant="outline"
                className="text-xs h-8"
                title="Export to Word document"
              >
                Export Word
              </Button>
              {selectedRows.size > 0 && (
                <>
                  <Button
                    onClick={exportSelectedToExcel}
                    size="sm"
                    variant="default"
                    className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
                  >
                    Export Selected ({selectedRows.size})
                  </Button>
                </>
              )}
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
                    filteredIssues.length > 0 &&
                    selectedRows.size === filteredIssues.length
                  }
                  onChange={toggleAllSelection}
                  className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[100px]"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center gap-1">
                  Severity
                  <SortIcon column="severity" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[100px]"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon column="type" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[80px]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon column="status" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors min-w-[350px]"
                onClick={() => handleSort('message')}
              >
                <div className="flex items-center gap-1">
                  Issue Message
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 min-w-[90px]">
                Effort
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
            {filteredIssues.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="px-6 py-12 text-center text-gray-500 bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">No issues found</p>
                    <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue, index) => {
                const isSelected = selectedRows.has(issue.key)
                const isExpanded = expandedRows.has(issue.key)
                const rowClass = isSelected
                  ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50 transition-colors'

                return (
                  <React.Fragment key={issue.key}>
                    <tr className={rowClass}>
                      <td className="px-3 py-3 whitespace-nowrap text-sm sticky left-0 z-10 bg-inherit border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(issue.key)}
                          className="cursor-pointer w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          className={`${getSeverityColor(issue.severity)} text-xs font-medium px-2 py-0.5`}
                        >
                          {issue.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatTypeName(issue.type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(issue.status)} text-xs px-2 py-0.5`}
                        >
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                        <div className="truncate" title={issue.message}>
                          {issue.message}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-mono text-xs text-gray-700" title={issue.component}>
                          {getFileName(issue.component)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                        {issue.line}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={issue.rule}>
                          {issue.rule}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {issue.effort}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {new Date(issue.creationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <Button
                          onClick={() => toggleRowExpansion(issue.key)}
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
                        <td colSpan={12} className="px-6 py-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-gray-700">Full Path:</span>
                                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800">
                                  {issue.component}
                                </code>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Text Range:</span>
                                <span className="ml-2 text-gray-600">
                                  Line {issue.textRange.startLine}
                                  {issue.textRange.startLine !== issue.textRange.endLine && (
                                    <span> - {issue.textRange.endLine}</span>
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Last Updated:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(issue.updateDate).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-gray-700">Scope:</span>
                                <span className="ml-2 text-gray-600">{issue.scope}</span>
                              </div>
                              {issue.cleanCodeAttribute && (
                                <div>
                                  <span className="font-semibold text-gray-700">Code Quality:</span>
                                  <span className="ml-2 text-gray-600">{issue.cleanCodeAttribute}</span>
                                </div>
                              )}
                              {issue.author && (
                                <div>
                                  <span className="font-semibold text-gray-700">Author:</span>
                                  <span className="ml-2 text-gray-600">{issue.author}</span>
                                </div>
                              )}
                            </div>
                            {issue.tags && issue.tags.length > 0 && (
                              <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-700">Tags:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {issue.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {issue.impacts && issue.impacts.length > 0 && (
                              <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-700">Impacts:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {issue.impacts.map((impact, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 rounded-md text-xs bg-purple-50 text-purple-700 border border-purple-200"
                                    >
                                      {impact.softwareQuality} ({impact.severity})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {issue.flows && issue.flows.length > 0 && (
                              <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-700">Code Flows ({issue.flows.length}):</span>
                                <div className="mt-2 space-y-2">
                                  {issue.flows.map((flow, flowIdx) => (
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

