'use client'

import { useState, useCallback } from 'react'
import IssuesTable from '@/components/IssuesTable'
import IssuesSummary from '@/components/IssuesSummary'
import IssuesCharts from '@/components/IssuesCharts'
import SearchPanel from '@/components/SearchPanel'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

export default function Home() {
  const [data, setData] = useState<SonarQubeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useState<{
    apiUrl: string
    componentKeys: string
    token?: string
  } | null>(null)

  // Simple fetch: just baseUrl + componentKeys using server action
  const fetchIssues = useCallback(async (
    apiUrl: string,
    componentKeys: string,
    token?: string
  ) => {
    setLoading(true)
    setError(null)
    
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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch issues'
      setError(errorMsg)
      console.error('Error fetching issues:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback((params: {
    apiUrl: string
    componentKeys: string
    token?: string
  }) => {
    setSearchParams({
      apiUrl: params.apiUrl,
      componentKeys: params.componentKeys,
      token: params.token,
    })
    fetchIssues(params.apiUrl, params.componentKeys, params.token)
  }, [fetchIssues])

  if (loading && !data && !error) {
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

        {error && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{error}</p>
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Make sure the API URL is correct (e.g., http://localhost:9004)</li>
                  <li>Verify that your SonarQube server is running and accessible</li>
                  <li>Check that the project key is correct</li>
                </ul>
              </div>
              <Button 
                onClick={() => {
                  if (searchParams) {
                    fetchIssues(searchParams.apiUrl, searchParams.componentKeys, searchParams.token)
                  }
                }} 
                variant="destructive"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <IssuesSummary data={data} />
            
            <IssuesCharts data={data} />
          </>
        )}

        {data && (
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
      </div>
    </main>
  )
}

