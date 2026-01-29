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
