'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SearchPanelProps {
  onSearch: (params: {
    apiUrl: string
    componentKeys?: string
    projectKey?: string
    token?: string
  }) => void
  loading?: boolean
}

const STORAGE_KEYS = {
  apiUrl: 'sonarqube-apiUrl',
  componentKeys: 'sonarqube-componentKeys',
  projectKey: 'sonarqube-projectKey',
  token: 'sonarqube-token',
}

const DEFAULT_VALUES = {
  apiUrl: 'http://localhost:9004',
  componentKeys: 'gbsp-rb',
  projectKey: 'gbsp-rb',
  token: '',
}

export default function SearchPanel({ onSearch, loading = false }: SearchPanelProps) {
  // Initialize with default values to avoid hydration mismatch
  // Then update from localStorage after mount
  const [apiUrl, setApiUrl] = useState(DEFAULT_VALUES.apiUrl)
  const [componentKeys, setComponentKeys] = useState(DEFAULT_VALUES.componentKeys)
  const [projectKey, setProjectKey] = useState(DEFAULT_VALUES.projectKey)
  const [token, setToken] = useState(DEFAULT_VALUES.token)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage after mount to avoid hydration issues
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedApiUrl = localStorage.getItem(STORAGE_KEYS.apiUrl)
      const savedComponentKeys = localStorage.getItem(STORAGE_KEYS.componentKeys)
      const savedProjectKey = localStorage.getItem(STORAGE_KEYS.projectKey)
      const savedToken = localStorage.getItem(STORAGE_KEYS.token)
      
      if (savedApiUrl) setApiUrl(savedApiUrl)
      if (savedComponentKeys) setComponentKeys(savedComponentKeys)
      if (savedProjectKey) setProjectKey(savedProjectKey)
      if (savedToken) setToken(savedToken)
    }
  }, [])

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.projectKey, projectKey)
    }
  }, [projectKey])

  // Save token to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token.trim()) {
        localStorage.setItem(STORAGE_KEYS.token, token)
      } else {
        // Remove token from localStorage if cleared
        localStorage.removeItem(STORAGE_KEYS.token)
      }
    }
  }, [token])

  // Function to clear token
  const clearToken = () => {
    setToken('')
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.token)
    }
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedApiUrl = apiUrl.trim()
    
    if (!trimmedApiUrl) {
      console.warn('Missing required fields: apiUrl')
      return
    }

    if (!componentKeys.trim() && !projectKey.trim()) {
      console.warn('Missing required fields: componentKeys or projectKey')
      return
    }
    
    // Save values when submitting
    const trimmedToken = token.trim() || undefined
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.apiUrl, trimmedApiUrl)
      localStorage.setItem(STORAGE_KEYS.componentKeys, componentKeys.trim())
      localStorage.setItem(STORAGE_KEYS.projectKey, projectKey.trim())
      // Token is already saved via useEffect, but ensure it's saved here too
      if (trimmedToken) {
        localStorage.setItem(STORAGE_KEYS.token, trimmedToken)
      }
    }
    
    console.log('SearchPanel submitting:', {
      apiUrl: trimmedApiUrl,
      componentKeys: componentKeys.trim() || undefined,
      projectKey: projectKey.trim() || undefined,
      hasToken: !!trimmedToken
    })
    
    onSearch({
      apiUrl: trimmedApiUrl,
      componentKeys: componentKeys.trim() || undefined,
      projectKey: projectKey.trim() || undefined,
      token: trimmedToken,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch()
    }
  }

  // Build API URLs in real-time
  const buildApiUrls = () => {
    let base = apiUrl.trim() || 'http://localhost:9004'
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `http://${base}`
    }
    base = base.replace(/\/$/, '')
    
    const urls: string[] = []
    
    if (componentKeys?.trim()) {
      urls.push(`${base}/api/issues/search?componentKeys=${encodeURIComponent(componentKeys.trim())}`)
    }
    
    if (projectKey?.trim()) {
      urls.push(`${base}/api/hotspots/search?projectKey=${encodeURIComponent(projectKey.trim())}`)
    }
    
    return urls
  }
  
  // Compute button text in a way that's consistent between server and client
  const getButtonText = () => {
    if (loading) return 'Fetching...'
    // During SSR (when not mounted), use default values to ensure consistency
    const currentComponentKeys = mounted ? componentKeys : DEFAULT_VALUES.componentKeys
    const currentProjectKey = mounted ? projectKey : DEFAULT_VALUES.projectKey
    const hasComponentKeys = currentComponentKeys?.trim() || false
    const hasProjectKey = currentProjectKey?.trim() || false
    if (hasComponentKeys && hasProjectKey) return 'Fetch Both'
    if (hasComponentKeys) return 'Fetch Issues'
    if (hasProjectKey) return 'Fetch Hotspots'
    return 'Fetch'
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
                Component Keys (for Issues)
              </label>
              <input
                type="text"
                value={componentKeys}
                onChange={(e) => setComponentKeys(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="gbsp-rb"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Component key(s) for fetching issues
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Project Key (for Hotspots)
              </label>
              <input
                type="text"
                value={projectKey}
                onChange={(e) => setProjectKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="gbsp-rb"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Project key for fetching security hotspots
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Token (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter SonarQube token if required"
                />
                {token && (
                  <Button
                    type="button"
                    onClick={clearToken}
                    variant="outline"
                    size="sm"
                    className="h-10 px-4"
                    title="Clear token"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                SonarQube token (optional - only needed if API requires authentication). Token is saved locally and can be cleared anytime.
              </p>
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={
                  loading || 
                  !apiUrl.trim() || 
                  (!componentKeys?.trim() && !projectKey?.trim())
                }
                className="w-full"
                size="lg"
              >
                {getButtonText()}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-md border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">
            API Request URL{buildApiUrls().length > 1 ? 's' : ''}:
          </p>
          {buildApiUrls().map((url, index) => (
            <code key={index} className="text-xs break-all text-gray-800 bg-white px-2 py-1.5 rounded border border-gray-300 block mt-2 first:mt-0">
              {url}
            </code>
          ))}
          {buildApiUrls().length === 0 && (
            <code className="text-xs text-gray-500 block">
              Enter component keys or project key
            </code>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

