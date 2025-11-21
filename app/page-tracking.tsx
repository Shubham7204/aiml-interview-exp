'use client'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function PageTracking() {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return

    // Track page load time
    const loadTime = performance.now()
    posthog.capture('page_load_time', {
      load_time_ms: loadTime,
      page: window.location.pathname
    })

    // Track session start
    posthog.capture('session_started', {
      referrer: document.referrer,
      url: window.location.href
    })

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - performance.timeOrigin
      posthog.capture('session_ended', {
        session_duration_ms: sessionDuration,
        page: window.location.pathname
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [posthog])

  return null
} 