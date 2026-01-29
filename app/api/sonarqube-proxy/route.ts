import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const baseUrl = searchParams.get('baseUrl')
    const componentKeys = searchParams.get('componentKeys')
    // NOTE: Do not accept tokens via query string; URLs can leak via logs/history/proxies.
    // Use POST with JSON body instead.
    const token = searchParams.get('token')

    // Trim and validate parameters
    const trimmedBaseUrl = baseUrl?.trim()
    const trimmedComponentKeys = componentKeys?.trim()
    const trimmedToken = token?.trim()

    if (!trimmedBaseUrl || !trimmedComponentKeys) {
      return NextResponse.json(
        { error: 'Missing baseUrl or componentKeys parameters' },
        { status: 400 }
      )
    }

    if (trimmedToken) {
      return NextResponse.json(
        { error: 'Do not pass token in query string. Use POST /api/sonarqube-proxy with JSON body.' },
        { status: 400 }
      )
    }

    // Normalize the base URL - ensure it doesn't have trailing slash
    // If SONARQUBE_URL is set, prefer it (safer for production) and ignore user-provided baseUrl.
    const configuredBaseUrl = process.env.SONARQUBE_URL?.trim()
    let normalizedBaseUrl = (configuredBaseUrl || trimmedBaseUrl).replace(/\/$/, '')
    
    // Convert 127.0.0.1 to localhost - SonarQube accepts localhost but not 127.0.0.1
    // This is a common security configuration in SonarQube
    if (normalizedBaseUrl.includes('127.0.0.1')) {
      normalizedBaseUrl = normalizedBaseUrl.replace(/127\.0\.0\.1/g, 'localhost')
      console.log('Converted 127.0.0.1 to localhost')
    }
    
    // Keep localhost as localhost - don't convert to 127.0.0.1
    // The browser uses localhost, so we should too
    
    // Build the URL - componentKeys can be comma-separated for multiple components
    const url = `${normalizedBaseUrl}/api/issues/search?componentKeys=${encodeURIComponent(trimmedComponentKeys)}`
    
    console.log('Proxy request:', {
      baseUrl: normalizedBaseUrl,
      componentKeys: trimmedComponentKeys,
      finalUrl: url
    })

    // Prepare headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    // GET handler does not support auth; use POST instead.

    // Simple fetch - let it work with any URL
    const req = await fetch(url, {
      method: 'GET',
      headers: headers,
      cache: 'no-store',
    })

    // Get the response text first (we can only read it once)
    const responseText = await req.text()
    
    if (!req.ok) {
      let errorMessage = `Failed to fetch: ${req.status} ${req.statusText || 'Unknown error'}`
      
      // Try to parse error as JSON
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => e.msg || e.message || String(e)).join('; ')
          } else if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
          } else if (errorData.message) {
            errorMessage = errorData.message
          } else if (responseText.length < 200) {
            errorMessage = responseText
          }
        } catch {
          // Not JSON, use text if short enough
          if (responseText.length < 200) {
            errorMessage = responseText
          }
        }
      }
      
      console.error('SonarQube API error:', {
        status: req.status,
        statusText: req.statusText,
        url: url,
        errorMessage
      })
      
      return NextResponse.json(
        { 
          error: errorMessage,
          status: req.status,
          url: url
        },
        { status: req.status }
      )
    }

    // Parse successful response
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
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)

    const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl : ''
    const componentKeys = typeof body?.componentKeys === 'string' ? body.componentKeys : ''
    const token = typeof body?.token === 'string' ? body.token : undefined

    const trimmedBaseUrl = baseUrl.trim()
    const trimmedComponentKeys = componentKeys.trim()
    const trimmedToken = token?.trim()

    if (!trimmedBaseUrl || !trimmedComponentKeys) {
      return NextResponse.json(
        { error: 'Missing baseUrl or componentKeys in request body' },
        { status: 400 }
      )
    }

    // If SONARQUBE_URL is set, prefer it (safer for production) and ignore user-provided baseUrl.
    const configuredBaseUrl = process.env.SONARQUBE_URL?.trim()
    let normalizedBaseUrl = (configuredBaseUrl || trimmedBaseUrl).replace(/\/$/, '')

    if (normalizedBaseUrl.includes('127.0.0.1')) {
      normalizedBaseUrl = normalizedBaseUrl.replace(/127\.0\.0\.1/g, 'localhost')
      console.log('Converted 127.0.0.1 to localhost')
    }

    const url = `${normalizedBaseUrl}/api/issues/search?componentKeys=${encodeURIComponent(trimmedComponentKeys)}`

    console.log('Proxy request (POST):', {
      baseUrl: normalizedBaseUrl,
      componentKeys: trimmedComponentKeys,
      hasToken: !!trimmedToken,
      finalUrl: url
    })

    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    if (trimmedToken) {
      // SonarQube token auth: use token as username with empty password
      // Format: Authorization: Basic base64(token:)
      const authString = Buffer.from(`${trimmedToken}:`).toString('base64')
      headers['Authorization'] = `Basic ${authString}`
    }

    const req = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    const responseText = await req.text()

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
          } else if (responseText.length < 200) {
            errorMessage = responseText
          }
        } catch {
          if (responseText.length < 200) {
            errorMessage = responseText
          }
        }
      }

      console.error('SonarQube API error:', {
        status: req.status,
        statusText: req.statusText,
        url,
        errorMessage
      })

      return NextResponse.json(
        {
          error: errorMessage,
          status: req.status,
          url
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
    console.error('Proxy error (POST):', error)
    return NextResponse.json(
      { error: 'Proxy request failed', details: String(error) },
      { status: 500 }
    )
  }
}
