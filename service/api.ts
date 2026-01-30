"use server"

export async function getSonarQubeIssues(baseUrl: string, projectKeys: string) {
  try {
    const url = `${baseUrl}/api/issues/search?projectKeys=${encodeURIComponent(projectKeys)}`
    console.log('Server action fetching from:', url)
    
    const req = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!req.ok) {
      let errorText = req.statusText
      try {
        errorText = await req.text()
      } catch (e) {
        console.error('Could not read error text:', e)
      }
      
      const errorMessage = `Failed to fetch: ${req.status} ${req.statusText}${errorText ? ` - ${errorText.substring(0, 200)}` : ''}`
      console.error('Fetch error:', {
        status: req.status,
        statusText: req.statusText,
        url: url,
        errorText: errorText.substring(0, 200)
      })
      throw new Error(errorMessage)
    }

    const res = await req.json()
    return res
  } catch (error) {
    console.error('Server action error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Unknown error: ${String(error)}`)
  }
}

export async function getSonarQubeHotspots(baseUrl: string, projectKey: string, token?: string) {
  // Normalize base URL at function scope for error handling
  let normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '')
  
  try {
    // Ensure it has protocol
    if (!normalizedBaseUrl.startsWith('http://') && !normalizedBaseUrl.startsWith('https://')) {
      normalizedBaseUrl = `http://${normalizedBaseUrl}`
    }
    
    // Ensure it has protocol
    if (!normalizedBaseUrl.startsWith('http://') && !normalizedBaseUrl.startsWith('https://')) {
      normalizedBaseUrl = `http://${normalizedBaseUrl}`
    }

    const url = `${normalizedBaseUrl}/api/hotspots/search?projectKey=${encodeURIComponent(projectKey)}`
    
    // Try without auth first (since direct URL works without auth)
    let headers: HeadersInit = {
      'Accept': 'application/json',
    }
    
    let req = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    let responseText = await req.text()

    // If we got 401/403 and have a token, retry with auth
    if ((req.status === 401 || req.status === 403) && token) {
      const trimmedToken = token.trim()
      const authString = Buffer.from(`${trimmedToken}:`).toString('base64')
      headers['Authorization'] = `Basic ${authString}`
      
      req = await fetch(url, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })
      
      responseText = await req.text()
    }

    if (!req.ok) {
      let errorMessage = `Failed to fetch: ${req.status} ${req.statusText || 'Unknown error'}`
      
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => e.msg || e.message || String(e)).join('; ')
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch {
          if (responseText.length < 500) {
            errorMessage = responseText
          }
        }
      }
      
      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Service: Hotspots fetch error:', {
          status: req.status,
          statusText: req.statusText,
          url: url.replace(token || '', '***REDACTED***'),
          errorMessage,
          hadAuth: !!token,
          responsePreview: responseText.substring(0, 200)
        })
      }
      
      throw new Error(errorMessage)
    }

    const res = JSON.parse(responseText)
    // Only log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Service: Hotspots fetched successfully:', {
        hotspotsCount: res?.hotspots?.length || 0,
        total: res?.paging?.total || 0
      })
    }
    return res
  } catch (error) {
    // Check for connection refused errors and provide helpful message
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorString = errorMessage.toLowerCase()
    
    if (errorString.includes('econnrefused') || errorString.includes('connection refused') || errorString.includes('fetch failed') || errorString.includes('connect timeout') || errorString.includes('und_err_connect_timeout')) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Service: Connection error:', errorMessage)
      }
      throw new Error(`Cannot connect to SonarQube server at ${normalizedBaseUrl}. Please verify that:\n1. The SonarQube server is running\n2. The URL is correct (e.g., http://localhost:9004 or http://10.0.156.139:9004)\n3. The server is accessible from this machine`)
    }
    
    // Only log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Service: Hotspots error:', error)
    }
    
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Unknown error: ${String(error)}`)
  }
}
