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
  PieChart,
  Pie,
  Legend,
} from 'recharts'

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

interface SecurityHotspotsChartsProps {
  data: SecurityHotspotsResponse
}

const PROBABILITY_COLORS = {
  HIGH: '#dc2626',
  MEDIUM: '#f97316',
  LOW: '#eab308',
}

const STATUS_COLORS = {
  TO_REVIEW: '#eab308',
  REVIEWED: '#22c55e',
  SAFE: '#3b82f6',
  FIXED: '#6b7280',
}

const PROBABILITY_ORDER = ['HIGH', 'MEDIUM', 'LOW']

export default function SecurityHotspotsCharts({ data }: SecurityHotspotsChartsProps) {
  // Vulnerability probability distribution
  const probabilityCounts = data.hotspots.reduce((acc, hotspot) => {
    acc[hotspot.vulnerabilityProbability] = (acc[hotspot.vulnerabilityProbability] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const probabilityData = PROBABILITY_ORDER.map((prob) => ({
    name: prob,
    value: probabilityCounts[prob] || 0,
    fill: PROBABILITY_COLORS[prob as keyof typeof PROBABILITY_COLORS] || '#6b7280',
  })).filter(item => item.value > 0)

  // Status distribution
  const statusCounts = data.hotspots.reduce((acc, hotspot) => {
    acc[hotspot.status] = (acc[hotspot.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || '#6b7280',
    }))
    .sort((a, b) => b.value - a.value)

  // Category distribution
  const categoryCounts = data.hotspots.reduce((acc, hotspot) => {
    acc[hotspot.securityCategory] = (acc[hotspot.securityCategory] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(categoryCounts)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 categories

  const highRiskCount = probabilityCounts.HIGH || 0
  const highRiskPercentage = data.paging.total > 0 
    ? ((highRiskCount / data.paging.total) * 100).toFixed(1) 
    : '0'

  const toReviewCount = statusCounts.TO_REVIEW || 0
  const toReviewPercentage = data.paging.total > 0 
    ? ((toReviewCount / data.paging.total) * 100).toFixed(1) 
    : '0'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value} {payload[0].value === 1 ? 'hotspot' : 'hotspots'}
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
            <div className="text-sm text-muted-foreground mb-1">High Risk Hotspots</div>
            <div className="text-3xl font-bold text-red-600">{highRiskCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{highRiskPercentage}% of total</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">To Review</div>
            <div className="text-3xl font-bold text-yellow-500">{toReviewCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{toReviewPercentage}% of total</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Hotspots</div>
            <div className="text-3xl font-bold text-blue-600">{data.paging.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Security hotspots found</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart - Risk Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hotspots by Risk Level</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Focus on HIGH risk hotspots first
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={probabilityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {probabilityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Quick stats below chart */}
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
            {probabilityData.map((item) => (
              <div key={item.name} className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: item.fill }}
                >
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground">{item.name} Risk</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution - Pie Chart */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hotspots by Status</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Review status distribution
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Security Categories */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Security Categories</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Most common security categories
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={categoryData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={12} tick={{ fill: '#6b7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                  width={90}
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

