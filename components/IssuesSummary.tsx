import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SonarQubeResponse {
  total: number
  effortTotal: number
  issues: Issue[]
}

interface Issue {
  severity: string
  type: string
}

export default function IssuesSummary({ data }: { data: SonarQubeResponse }) {
  const severityCounts = data.issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formatEffort = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const criticalCount = (severityCounts.BLOCKER || 0) + (severityCounts.CRITICAL || 0)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="text-2xl font-bold text-red-600">{data.total}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Issues</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
            <div className="text-sm text-muted-foreground mt-1">Critical</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{severityCounts.MAJOR || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Major</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">
              {formatEffort(data.effortTotal)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Effort</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
