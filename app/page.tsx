'use client'

import { useState, useCallback } from 'react'
import IssuesTable from '@/components/IssuesTable'
import SecurityHotspotsTable from '@/components/SecurityHotspotsTable'
import IssuesSummary from '@/components/IssuesSummary'
import IssuesCharts from '@/components/IssuesCharts'
import SecurityHotspotsSummary from '@/components/SecurityHotspotsSummary'
import SecurityHotspotsCharts from '@/components/SecurityHotspotsCharts'
import SearchPanel from '@/components/SearchPanel'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchHotspotsAction } from '@/actions/hotspots.action'

interface SonarQubeResponse {
  total: number
  p: number
  ps: number
  paging: {
    pageIndex: number
    pageSize: number
    total: number
  }
  effortTotal: number
  issues: Issue[]
  components: Component[]
}

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

interface Component {
  key: string
  enabled: boolean
  qualifier: string
  name: string
  longName: string
  path: string
}

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

interface SecurityHotspotsResponse {
  paging: {
    pageIndex: number
    pageSize: number
    total: number
  }
  hotspots: SecurityHotspot[]
}

export default function Home() {
  const [data, setData] = useState<SonarQubeResponse | null>(null)
  const [hotspotsData, setHotspotsData] = useState<SecurityHotspotsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [hotspotsError, setHotspotsError] = useState<string | null>(null)

  // Helper function to check if an error is a connection error
  const isConnectionError = (errorMsg: string | null): boolean => {
    if (!errorMsg) return false
    const msg = errorMsg.toLowerCase()
    return msg.includes('cannot connect') || 
           msg.includes('econnrefused') || 
           msg.includes('connection refused') ||
           msg.includes('connect timeout') ||
           msg.includes('server is running') ||
           msg.includes('server is accessible')
  }
  const [searchParams, setSearchParams] = useState<{
    apiUrl: string
    componentKeys?: string
    projectKey?: string
    token?: string
  } | null>(null)

  // Fetch issues
  const fetchIssues = useCallback(async (
    apiUrl: string,
    componentKeys: string,
    token?: string
  ) => {
    setIssuesError(null)
    
    try {
      // Normalize base URL
      let baseUrl = apiUrl.trim() || 'http://localhost:9004'
      
      // Ensure it has protocol
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `http://${baseUrl}`
      }
      
      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/$/, '')
      
      // Trim componentKeys to handle any whitespace
      const trimmedComponentKeys = componentKeys.trim()
      
      if (!trimmedComponentKeys) {
        throw new Error('Component keys cannot be empty')
      }
      
      // Use API route (proxy) - server actions have issues with localhost
      const response = await fetch('/api/sonarqube-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl,
          componentKeys: trimmedComponentKeys,
          token: token?.trim() || undefined,
        }),
        cache: 'no-store',
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If not JSON, use status text
        }
        throw new Error(errorMessage)
      }

      const jsonData: SonarQubeResponse = await response.json()
      
      // Validate response structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid response format from API')
      }
      
      setData(jsonData as SonarQubeResponse)
      console.log(`Successfully fetched ${(jsonData as SonarQubeResponse).issues?.length || 0} issues`)
      return { success: true, type: 'issues' as const }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch issues'
      console.error('Error fetching issues:', err)
      // Don't display connection errors
      if (!isConnectionError(errorMsg)) {
        setIssuesError(errorMsg)
      } else {
        setIssuesError(null)
      }
      return { success: false, error: errorMsg, type: 'issues' as const }
    }
  }, [])

  // Fetch security hotspots using server action (service -> action -> UI pattern)
  const fetchHotspots = useCallback(async (
    apiUrl: string,
    projectKey: string,
    token?: string
  ) => {
    setHotspotsError(null)
    
    try {
      // Normalize base URL
      let baseUrl = apiUrl.trim() || 'http://localhost:9004'
      
      // Ensure it has protocol
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `http://${baseUrl}`
      }
      
      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/$/, '')
      
      // Trim projectKey to handle any whitespace
      const trimmedProjectKey = projectKey.trim()
      
      if (!trimmedProjectKey) {
        throw new Error('Project key cannot be empty')
      }
      
      // Use server action (service -> action -> UI pattern)
      const result = await fetchHotspotsAction(
        baseUrl,
        trimmedProjectKey,
        token?.trim() || undefined
      )
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch security hotspots')
      }

      const jsonData = result.data as SecurityHotspotsResponse
      
      // Validate response structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('Invalid response format from API')
      }
      
      setHotspotsData(jsonData)
      console.log(`Successfully fetched ${jsonData.hotspots?.length || 0} security hotspots`)
      return { success: true, type: 'hotspots' as const }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch security hotspots'
      console.error('Error fetching security hotspots:', err)
      // Don't display connection errors
      if (!isConnectionError(errorMsg)) {
        setHotspotsError(errorMsg)
      } else {
        setHotspotsError(null)
      }
      return { success: false, error: errorMsg, type: 'hotspots' as const }
    }
  }, [])

  const handleSearch = useCallback(async (params: {
    apiUrl: string
    componentKeys?: string
    projectKey?: string
    token?: string
  }) => {
    setSearchParams(params)
    setLoading(true)
    setError(null)
    setIssuesError(null)
    setHotspotsError(null)
    
    const promises: Promise<any>[] = []
    
    if (params.componentKeys) {
      promises.push(fetchIssues(params.apiUrl, params.componentKeys, params.token))
    }
    
    if (params.projectKey) {
      promises.push(fetchHotspots(params.apiUrl, params.projectKey, params.token))
    }
    
    if (promises.length === 0) {
      setLoading(false)
      return
    }
    
    const results = await Promise.allSettled(promises)
    
    // Check for errors - but allow partial success
    // Filter out connection errors from being displayed
    const errors: string[] = []
    results.forEach((result) => {
      if (result.status === 'rejected') {
        errors.push('Unknown error occurred')
      } else if (result.value && !result.value.success) {
        const errorValue = result.value as { success: false; error?: string; type?: string }
        const errorMsg = errorValue.error || 'Unknown error'
        // Skip connection errors
        if (!isConnectionError(errorMsg)) {
          const typeLabel = errorValue.type === 'issues' ? 'Issues' : 'Hotspots'
          errors.push(`${typeLabel}: ${errorMsg}`)
        }
      }
    })
    
    // Only set general error if all requests failed (and errors are not connection errors)
    if (errors.length > 0 && errors.length === promises.length) {
      setError(errors.join('; '))
    } else {
      // Clear error state if all errors were connection errors
      setError(null)
    }
    
    setLoading(false)
  }, [fetchIssues, fetchHotspots])

  if (loading && !data && !hotspotsData && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            SonarQube Issues Viewer
          </h1>
          <p className="text-muted-foreground">
            View and analyze code quality issues from SonarQube
          </p>
        </div>

        <SearchPanel onSearch={handleSearch} loading={loading} />

        {error && !isConnectionError(error) && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 font-medium whitespace-pre-line">{error}</p>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {error.includes('401') || error.includes('Authentication') ? (
                    <>
                      <li className="font-semibold text-red-600">This error indicates authentication is required</li>
                      <li>Enter your SonarQube token in the "Token (Optional)" field</li>
                      <li>To get a token: SonarQube → My Account → Security → Generate Token</li>
                      <li>Make sure the token has the necessary permissions to access the project</li>
                    </>
                  ) : (
                    <>
                      <li>Make sure the API URL is correct (e.g., http://10.0.156.139:9004)</li>
                      <li>Verify that your SonarQube server is running and accessible</li>
                      <li>Check that the project/component keys are correct</li>
                      <li>If authentication is required, enter your SonarQube token</li>
                    </>
                  )}
                </ul>
              </div>
              <Button 
                onClick={() => {
                  if (searchParams) {
                    handleSearch(searchParams)
                  }
                }} 
                variant="destructive"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {issuesError && searchParams && !isConnectionError(issuesError) && (
          <Card className="mb-6 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-600">Issues Fetch Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm whitespace-pre-line">{issuesError}</p>
              <Button 
                onClick={() => {
                  if (searchParams && searchParams.componentKeys) {
                    fetchIssues(searchParams.apiUrl, searchParams.componentKeys, searchParams.token)
                  }
                }} 
                variant="outline"
                size="sm"
              >
                Retry Issues
              </Button>
            </CardContent>
          </Card>
        )}


        {data && searchParams && (
          <>
            <IssuesSummary data={data} />
            
            <IssuesCharts data={data} />
          </>
        )}

        {data && searchParams && (
          <Card className="mt-8">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Code Quality Issues
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.issues.length} {data.issues.length === 1 ? 'issue' : 'issues'} found
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <IssuesTable issues={data.issues} />
            </CardContent>
          </Card>
        )}

        {hotspotsError && searchParams && !isConnectionError(hotspotsError) && (
          <Card className="mb-6 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-600">Security Hotspots Fetch Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-sm whitespace-pre-line">{hotspotsError}</p>
              <Button 
                onClick={() => {
                  if (searchParams && searchParams.projectKey) {
                    fetchHotspots(searchParams.apiUrl, searchParams.projectKey, searchParams.token)
                  }
                }} 
                variant="outline"
                size="sm"
              >
                Retry Hotspots
              </Button>
            </CardContent>
          </Card>
        )}

        {hotspotsData && searchParams && (
          <>
            <SecurityHotspotsSummary data={hotspotsData} />
            
            <SecurityHotspotsCharts data={hotspotsData} />
          </>
        )}

        {hotspotsData && searchParams && (
          <Card className="mt-8">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Security Hotspots
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hotspotsData.hotspots.length} {hotspotsData.hotspots.length === 1 ? 'hotspot' : 'hotspots'} found
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SecurityHotspotsTable hotspots={hotspotsData.hotspots} />
            </CardContent>
          </Card>
        )}

      </div>
    </main>
  )
}

