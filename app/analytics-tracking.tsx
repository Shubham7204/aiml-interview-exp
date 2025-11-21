'use client'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function AnalyticsTracking() {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    // Track when analytics page is viewed
    posthog.capture('analytics_page_viewed', {
      page: 'analytics',
      timestamp: new Date().toISOString()
    })

    // Track user properties
    posthog.people.set({
      last_analytics_view: new Date().toISOString(),
      user_type: 'admin'
    })

    // Track device information
    const deviceInfo = {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    posthog.capture('device_info', deviceInfo)

  }, [posthog])

  return null
} 