import React, { useState } from 'react'
import IssueCard from './IssueCard'

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

export default function IssuesList({ issues }: { issues: Issue[] }) {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('severity')

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
      switch (sortBy) {
        case 'severity':
          const severityOrder = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']
          return (
            severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
          )
        case 'line':
          return a.line - b.line
        case 'date':
          return (
            new Date(b.creationDate).getTime() -
            new Date(a.creationDate).getTime()
          )
        default:
          return 0
      }
    })

  const uniqueSeverities = Array.from(
    new Set(issues.map((i) => i.severity))
  ).sort()
  const uniqueTypes = Array.from(new Set(issues.map((i) => i.type))).sort()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Filter by Severity:
          </label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="ALL">All</option>
            {uniqueSeverities.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Filter by Type:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="ALL">All</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="severity">Severity</option>
            <option value="line">Line Number</option>
            <option value="date">Date</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-600">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      </div>

      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No issues found matching the selected filters.
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard key={issue.key} issue={issue} />
          ))
        )}
      </div>
    </div>
  )
}





