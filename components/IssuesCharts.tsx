'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SonarQubeResponse {
  total: number
  effortTotal: number
  issues: Issue[]
}

interface Issue {
  severity: string
  type: string
}

interface IssuesChartsProps {
  data: SonarQubeResponse
}

const SEVERITY_COLORS = {
  BLOCKER: '#dc2626',
  CRITICAL: '#ea580c',
  MAJOR: '#f97316',
  MINOR: '#eab308',
  INFO: '#3b82f6',
}

const SEVERITY_ORDER = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'INFO']

export default function IssuesCharts({ data }: IssuesChartsProps) {
  // Severity distribution - most important metric
  const severityCounts = data.issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const severityData = SEVERITY_ORDER.map((severity) => ({
    name: severity,
    count: severityCounts[severity] || 0,
    fill: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#6b7280',
  })).filter(item => item.count > 0)

  // Type distribution - simplified
  const typeCounts = data.issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Format type names for better display
  const formatTypeName = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  const typeData = Object.entries(typeCounts)
    .map(([name, count]) => ({
      name: formatTypeName(name),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 types only

  // Calculate critical issues percentage
  const criticalCount = (severityCounts.BLOCKER || 0) + (severityCounts.CRITICAL || 0)
  const criticalPercentage = data.total > 0 ? ((criticalCount / data.total) * 100).toFixed(1) : '0'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} {payload[0].value === 1 ? 'issue' : 'issues'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Key Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Critical Issues</div>
            <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{criticalPercentage}% of total</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Major Issues</div>
            <div className="text-3xl font-bold text-orange-500">{severityCounts.MAJOR || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.total > 0 ? (((severityCounts.MAJOR || 0) / data.total) * 100).toFixed(1) : '0'}% of total
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Effort</div>
            <div className="text-2xl font-bold text-blue-600">
              {data.effortTotal < 60 
                ? `${data.effortTotal}min`
                : `${Math.floor(data.effortTotal / 60)}h ${data.effortTotal % 60}min`
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">Estimated fix time</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issues by Severity</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Focus on BLOCKER and CRITICAL issues first
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={severityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                fontSize={13}
                fontWeight={500}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Quick stats below chart */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-5 gap-2">
            {severityData.map((item) => (
              <div key={item.name} className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: item.fill }}
                >
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Issue Types - Simplified */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Issue Types</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Most common issue categories
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={typeData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={12} tick={{ fill: '#6b7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
