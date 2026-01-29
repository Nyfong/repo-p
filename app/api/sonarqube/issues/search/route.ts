import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // SECURITY: Do not accept secrets via query params. URLs can leak via logs/history/proxies.
    const authToken = searchParams.get('token')
    const username = searchParams.get('username')
    const password = searchParams.get('password')
    if (authToken || username || password) {
      return NextResponse.json(
        { error: 'Do not pass token/username/password in query string. Use Authorization header or POST.' },
        { status: 400 }
      )
    }
    
    // Remove auth params from search params for the actual API call
    const apiParams = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (!['token', 'username', 'password'].includes(key)) {
        apiParams.append(key, value)
      }
    })

    // Build the SonarQube API URL
    const sonarQubeUrl = process.env.SONARQUBE_URL || 'http://localhost:9004'
    const apiUrl = `${sonarQubeUrl}/api/issues/search?${apiParams.toString()}`

    // Build headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    // Optional: allow client to pass Authorization header instead of putting secrets in URL.
    const incomingAuth = request.headers.get('authorization')
    if (incomingAuth) {
      headers['Authorization'] = incomingAuth
    }

    // Fetch from SonarQube API
    const response = await fetch(apiUrl, {
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      return NextResponse.json(
        { 
          error: `Failed to fetch: ${response.status} ${response.statusText}`,
          details: errorText.substring(0, 200)
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('SonarQube API error:', error)
    return NextResponse.json(
      { error: 'API request failed', details: String(error) },
      { status: 500 }
    )
  }
}



