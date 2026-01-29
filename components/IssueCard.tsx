import React, { useState } from 'react'

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

export default function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false)

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileName = (component: string) => {
    const parts = component.split(':')
    return parts[parts.length - 1] || component
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                issue.severity
              )}`}
            >
              {issue.severity}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                issue.status
              )}`}
            >
              {issue.status}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
              {issue.type}
            </span>
            {issue.quickFixAvailable && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                Quick Fix Available
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {issue.message}
          </h3>

          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="font-medium">File:</span>{' '}
              <code className="bg-gray-100 px-1 rounded">
                {getFileName(issue.component)}
              </code>
            </div>
            <div>
              <span className="font-medium">Line:</span> {issue.line}
              {issue.textRange.startLine !== issue.textRange.endLine && (
                <span>
                  {' '}
                  ({issue.textRange.startLine}-
                  {issue.textRange.endLine})
                </span>
              )}
            </div>
            <div>
              <span className="font-medium">Rule:</span>{' '}
              <code className="bg-gray-100 px-1 rounded">{issue.rule}</code>
            </div>
            <div>
              <span className="font-medium">Effort:</span> {issue.effort} |{' '}
              <span className="font-medium">Debt:</span> {issue.debt}
            </div>
            {issue.author && (
              <div>
                <span className="font-medium">Author:</span> {issue.author}
              </div>
            )}
            <div>
              <span className="font-medium">Created:</span>{' '}
              {formatDate(issue.creationDate)} |{' '}
              <span className="font-medium">Updated:</span>{' '}
              {formatDate(issue.updateDate)}
            </div>
          </div>

          {issue.tags && issue.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {issue.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {issue.impacts && issue.impacts.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">Impacts: </span>
              {issue.impacts.map((impact, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 mr-1"
                >
                  {impact.softwareQuality} ({impact.severity})
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          {expanded ? 'Less' : 'More'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Component Path:</h4>
            <code className="text-sm bg-gray-100 p-2 rounded block">
              {issue.component}
            </code>
          </div>

          {issue.flows && issue.flows.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                Flows ({issue.flows.length}):
              </h4>
              <div className="space-y-2">
                {issue.flows.map((flow, flowIdx) => (
                  <div
                    key={flowIdx}
                    className="bg-gray-50 p-3 rounded border border-gray-200"
                  >
                    {flow.locations.map((location, locIdx) => (
                      <div key={locIdx} className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          {getFileName(location.component)}
                        </span>
                        :{location.textRange.startLine}
                        {location.textRange.startLine !==
                          location.textRange.endLine && (
                          <span>-{location.textRange.endLine}</span>
                        )}
                        {location.msg && (
                          <span className="ml-2 text-gray-500">
                            - {location.msg}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Clean Code Attribute:</span>
              <div className="text-gray-600">{issue.cleanCodeAttribute}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Category:</span>
              <div className="text-gray-600">
                {issue.cleanCodeAttributeCategory}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Scope:</span>
              <div className="text-gray-600">{issue.scope}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Issue Status:</span>
              <div className="text-gray-600">{issue.issueStatus}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Linked Ticket:</span>
              <div className="text-gray-600">{issue.linkedTicketStatus}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Issue Key:</span>
              <div className="text-gray-600 text-xs break-all">{issue.key}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


