import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let normalizedBaseUrl = '' // Declare at function scope for error handling
  try {
    const body = await request.json().catch(() => null)

    const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl : ''
    const projectKey = typeof body?.projectKey === 'string' ? body.projectKey : ''
    const componentKeys = typeof body?.componentKeys === 'string' ? body.componentKeys : ''
    const token = typeof body?.token === 'string' ? body.token : undefined

    const trimmedBaseUrl = baseUrl.trim()
    const trimmedProjectKey = projectKey.trim()
    const trimmedComponentKeys = componentKeys.trim()
    const trimmedToken = token?.trim()

    if (!trimmedBaseUrl) {
      return NextResponse.json(
        { error: 'Missing baseUrl in request body' },
        { status: 400 }
      )
    }

    // Prefer projectKey for hotspots API (as specified by user)
    // Fallback to componentKeys if projectKey not provided
    const keyToUse = trimmedProjectKey || trimmedComponentKeys
    if (!keyToUse) {
      return NextResponse.json(
        { error: 'Missing projectKey or componentKeys in request body' },
        { status: 400 }
      )
    }

    // If SONARQUBE_URL is set, prefer it (safer for production) and ignore user-provided baseUrl.
    const configuredBaseUrl = process.env.SONARQUBE_URL?.trim()
    normalizedBaseUrl = (configuredBaseUrl || trimmedBaseUrl).replace(/\/$/, '')

    if (normalizedBaseUrl.includes('127.0.0.1')) {
      normalizedBaseUrl = normalizedBaseUrl.replace(/127\.0\.0\.1/g, 'localhost')
      console.log('Converted 127.0.0.1 to localhost')
    }

    // Use projectKey parameter (as specified: /api/hotspots/search?projectKey=gbsp-rb)
    // Fallback to componentKeys if projectKey not available
    const useProjectKey = !!trimmedProjectKey
    let url = useProjectKey 
      ? `${normalizedBaseUrl}/api/hotspots/search?projectKey=${encodeURIComponent(trimmedProjectKey)}`
      : `${normalizedBaseUrl}/api/hotspots/search?componentKeys=${encodeURIComponent(trimmedComponentKeys)}`

    console.log('Hotspots proxy request (POST):', {
      baseUrl: normalizedBaseUrl,
      projectKey: trimmedProjectKey || 'none',
      componentKeys: trimmedComponentKeys || 'none',
      keyToUse,
      hasToken: !!trimmedToken,
      tokenLength: trimmedToken?.length || 0,
      tokenPreview: trimmedToken ? `${trimmedToken.substring(0, 8)}...${trimmedToken.substring(Math.max(0, trimmedToken.length - 8))}` : 'none',
      finalUrl: url,
      parameterUsed: useProjectKey ? 'projectKey' : 'componentKeys'
    })

    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    // Use Basic auth header (matches curl -u "token" command)
    // curl -u "token" uses Basic auth with token as username and empty password
    if (trimmedToken) {
      const authString = Buffer.from(`${trimmedToken}:`).toString('base64')
      headers['Authorization'] = `Basic ${authString}`
      
      console.log('Hotspots API: Using Basic auth (matching curl -u):', {
        hasAuthHeader: true,
        url: url.replace(trimmedToken, '***REDACTED***'),
        tokenLength: trimmedToken.length,
        tokenFirstChars: trimmedToken.substring(0, 8),
        tokenLastChars: trimmedToken.substring(Math.max(0, trimmedToken.length - 8)),
        authStringLength: authString.length
      })
    } else {
      console.warn('No token provided for hotspots API request')
    }

    console.log('Making request to SonarQube:', {
      url,
      method: 'GET',
      hasAuth: !!trimmedToken,
      headers: Object.keys(headers),
      authHeaderPresent: !!headers['Authorization']
    })

    let req = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      // Don't follow redirects automatically (curl doesn't)
      redirect: 'manual',
    })

    // Handle redirects manually if needed
    if (req.status >= 300 && req.status < 400) {
      const location = req.headers.get('location')
      if (location) {
        console.log('Following redirect to:', location)
        req = await fetch(location, {
          method: 'GET',
          headers,
          cache: 'no-store',
        })
      }
    }

    let responseText = await req.text()
    
    // Log the actual response for debugging
    console.log('SonarQube response:', {
      status: req.status,
      statusText: req.statusText,
      headers: Object.fromEntries(req.headers.entries()),
      responsePreview: responseText.substring(0, 200)
    })
    
    // If Basic auth failed, try with token as query parameter as fallback
    if (!req.ok && (req.status === 403 || req.status === 401) && trimmedToken) {
      console.log('Basic auth failed, trying with token as query parameter...')
      const separator = url.includes('?') ? '&' : '?'
      const urlWithToken = `${url}${separator}token=${encodeURIComponent(trimmedToken)}`
      
      const reqWithQuery = await fetch(urlWithToken, {
        method: 'GET',
        headers,
        cache: 'no-store',
      })
      
      const responseTextWithQuery = await reqWithQuery.text()
      
      // Use the query parameter response if it's better
      if (reqWithQuery.status !== 403 && reqWithQuery.status !== 401) {
        req = reqWithQuery
        responseText = responseTextWithQuery
        console.log('Query parameter token succeeded:', { status: req.status })
      } else {
        console.log('Query parameter token also failed:', { status: reqWithQuery.status })
      }
    }

    if (!req.ok) {
      let errorMessage = `Failed to fetch: ${req.status} ${req.statusText || 'Unknown error'}`
      let isPermissionError = false
      
      // Special handling for 401 (Unauthorized)
      if (req.status === 401) {
        isPermissionError = true
        if (!trimmedToken) {
          errorMessage = 'Authentication required. This SonarQube instance requires authentication. Please enter your SonarQube token in the Token field.'
        } else {
          errorMessage = 'Authentication failed. The provided token is invalid or expired. Please check your token and try again.'
        }
      }

      if (responseText) {
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((e: any) => e.msg || e.message || String(e)).join('; ')
            if (errorMessages) {
              errorMessage = errorMessages
              // Check for permission-related keywords
              if (errorMessages.toLowerCase().includes('insufficient privileges') ||
                  errorMessages.toLowerCase().includes('permission') ||
                  errorMessages.toLowerCase().includes('access denied') ||
                  errorMessages.toLowerCase().includes('forbidden')) {
                isPermissionError = true
              }
            }
          } else if (errorData.error) {
            const errorText = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
            if (errorText) {
              errorMessage = errorText
              if (errorText.toLowerCase().includes('insufficient privileges') ||
                  errorText.toLowerCase().includes('permission') ||
                  errorText.toLowerCase().includes('access denied') ||
                  errorText.toLowerCase().includes('forbidden')) {
                isPermissionError = true
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message
            if (errorData.message.toLowerCase().includes('insufficient privileges') ||
                errorData.message.toLowerCase().includes('permission') ||
                errorData.message.toLowerCase().includes('access denied') ||
                errorData.message.toLowerCase().includes('forbidden')) {
              isPermissionError = true
            }
          } else if (responseText.length < 500) {
            // Use response text if it's not too long
            errorMessage = responseText
            if (responseText.toLowerCase().includes('insufficient privileges') ||
                responseText.toLowerCase().includes('permission') ||
                responseText.toLowerCase().includes('access denied') ||
                responseText.toLowerCase().includes('forbidden')) {
              isPermissionError = true
            }
          }
        } catch {
          if (responseText.length < 500) {
            errorMessage = responseText
            if (responseText.toLowerCase().includes('insufficient privileges') ||
                responseText.toLowerCase().includes('permission') ||
                responseText.toLowerCase().includes('access denied') ||
                responseText.toLowerCase().includes('forbidden')) {
              isPermissionError = true
            }
          }
        }
      }

      // Check status code for permission errors
      if (req.status === 403 || req.status === 401) {
        isPermissionError = true
      }

      // Enhance error message for permission issues
      if (isPermissionError) {
        if (!trimmedToken) {
          errorMessage = 'Insufficient privileges: Authentication required. Please provide a SonarQube token with appropriate permissions.'
        } else {
          errorMessage = `Insufficient privileges: ${errorMessage}. Your SonarQube token needs "Browse" or "Execute Analysis" permissions to view security hotspots.`
        }
      }

      // Only log errors in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('SonarQube Hotspots API error:', {
          status: req.status,
          statusText: req.statusText,
          url,
          parameterUsed: useProjectKey ? 'projectKey' : 'componentKeys',
          errorMessage,
          responseText: responseText.substring(0, 500),
          hasAuth: !!trimmedToken,
          tokenLength: trimmedToken?.length || 0,
          isPermissionError,
          authMethod: trimmedToken ? 'Basic Auth (curl -u style)' : 'None'
        })
      }

      return NextResponse.json(
        {
          error: errorMessage,
          status: req.status,
          url,
          isPermissionError
        },
        { status: req.status }
      )
    }

    let res
    try {
      res = JSON.parse(responseText)
    } catch (e) {
      throw new Error(`Invalid JSON response: ${String(e)}`)
    }

    return NextResponse.json(res, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
      },
    })
  } catch (error) {
    // Check for connection refused errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorString = errorMessage.toLowerCase()
    
    const baseUrlForError = normalizedBaseUrl || 'the specified URL'
    
    if (errorString.includes('econnrefused') || errorString.includes('connection refused') || errorString.includes('fetch failed') || errorString.includes('connect timeout') || errorString.includes('und_err_connect_timeout')) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Hotspots proxy error (POST): Connection failed:', errorMessage)
      }
      return NextResponse.json(
        { 
          error: `Cannot connect to SonarQube server at ${baseUrlForError}. Please verify that:\n1. The SonarQube server is running\n2. The URL is correct (e.g., http://localhost:9004 or http://10.0.156.139:9004)\n3. The server is accessible from this machine`,
          isConnectionError: true,
          url: baseUrlForError
        },
        { status: 503 }
      )
    }
    
    // Only log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Hotspots proxy error (POST):', error)
    }
    
    return NextResponse.json(
      { error: 'Proxy request failed', details: errorMessage },
      { status: 500 }
    )
  }
}
