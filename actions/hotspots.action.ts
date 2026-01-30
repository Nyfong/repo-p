"use server"

import { getSonarQubeHotspots } from '@/service/api'

export async function fetchHotspotsAction(
  baseUrl: string,
  projectKey: string,
  token?: string
) {
  try {
    const result = await getSonarQubeHotspots(baseUrl, projectKey, token)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('Action: Hotspots fetch failed:', error instanceof Error ? error.message : String(error))
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hotspots'
    }
  }
}

