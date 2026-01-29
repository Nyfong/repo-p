'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SearchPanelProps {
  onSearch: (params: {
    apiUrl: string
    componentKeys: string
    token?: string
  }) => void
  loading?: boolean
}

const STORAGE_KEYS = {
  apiUrl: 'sonarqube-apiUrl',
  componentKeys: 'sonarqube-componentKeys',
}

const DEFAULT_VALUES = {
  apiUrl: 'http://localhost:9004',
  componentKeys: 'gbsp-p',
  token: '',
}

export default function SearchPanel({ onSearch, loading = false }: SearchPanelProps) {
  // Load saved values from localStorage on mount
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.apiUrl) || DEFAULT_VALUES.apiUrl
    }
    return DEFAULT_VALUES.apiUrl
  })
  
  const [componentKeys, setComponentKeys] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.componentKeys) || DEFAULT_VALUES.componentKeys
    }
    return DEFAULT_VALUES.componentKeys
  })
  
  const [token, setToken] = useState(() => {
    return DEFAULT_VALUES.token
  })

  // Save to localStorage whenever values change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.apiUrl, apiUrl)
    }
  }, [apiUrl])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.componentKeys, componentKeys)
    }
  }, [componentKeys])

  // Intentionally do NOT persist token to localStorage (secrets should not be stored in web storage).

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedApiUrl = apiUrl.trim()
    const trimmedComponentKeys = componentKeys.trim()
    
    if (!trimmedApiUrl || !trimmedComponentKeys) {
      console.warn('Missing required fields:', { apiUrl: trimmedApiUrl, componentKeys: trimmedComponentKeys })
      return
    }
    
    // Save values when submitting
    const trimmedToken = token.trim() || undefined
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.apiUrl, trimmedApiUrl)
      localStorage.setItem(STORAGE_KEYS.componentKeys, trimmedComponentKeys)
    }
    
    console.log('SearchPanel submitting:', {
      apiUrl: trimmedApiUrl,
      componentKeys: trimmedComponentKeys,
      hasToken: !!trimmedToken
    })
    
    onSearch({
      apiUrl: trimmedApiUrl,
      componentKeys: trimmedComponentKeys,
      token: trimmedToken,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch()
    }
  }

  // Build API URL in real-time
  const buildApiUrl = () => {
    let base = apiUrl.trim() || 'http://localhost:9004'
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `http://${base}`
    }
    base = base.replace(/\/$/, '')
    const keys = componentKeys.trim() || 'gbsp-p'
    return `${base}/api/issues/search?componentKeys=${encodeURIComponent(keys)}`
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Dynamic Search & Fetch</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Base URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="http://localhost:9004"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Base URL (e.g., http://localhost:9004)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Component Keys
              </label>
              <input
                type="text"
                value={componentKeys}
                onChange={(e) => setComponentKeys(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="gbsp-p"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Component key(s) to search for
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Token (Optional)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter SonarQube token if required"
              />
              <p className="text-xs text-muted-foreground mt-1">
                SonarQube token (optional - only needed if API requires authentication)
              </p>
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={loading || !apiUrl.trim() || !componentKeys.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? 'Fetching...' : 'Fetch Issues'}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-md border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">
            API Request URL:
          </p>
          <code className="text-xs break-all text-gray-800 bg-white px-2 py-1.5 rounded border border-gray-300 block">
            {buildApiUrl()}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}

