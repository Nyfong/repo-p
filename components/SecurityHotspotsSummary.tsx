import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SecurityHotspot {
  securityCategory: string
  vulnerabilityProbability: string
  status: string
}

interface SecurityHotspotsResponse {
  paging: {
    total: number
  }
  hotspots: SecurityHotspot[]
}

export default function SecurityHotspotsSummary({ data }: { data: SecurityHotspotsResponse }) {
  const probabilityCounts = data.hotspots.reduce((acc, hotspot) => {
    acc[hotspot.vulnerabilityProbability] = (acc[hotspot.vulnerabilityProbability] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusCounts = data.hotspots.reduce((acc, hotspot) => {
    acc[hotspot.status] = (acc[hotspot.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const highRiskCount = probabilityCounts.HIGH || 0
  const toReviewCount = statusCounts.TO_REVIEW || 0

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Security Hotspots Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="text-2xl font-bold text-red-600">{data.paging.total}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Hotspots</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">{highRiskCount}</div>
            <div className="text-sm text-muted-foreground mt-1">High Risk</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-600">{toReviewCount}</div>
            <div className="text-sm text-muted-foreground mt-1">To Review</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{probabilityCounts.MEDIUM || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Medium Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

