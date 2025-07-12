'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        // Enable automatic pageview capture for better tracking
        capture_pageview: true,
        // Enable autocapture for clicks, form submissions, etc.
        autocapture: true,
        // Enable session recordings
        capture_pageleave: true,
        // Enable rage clicks
        rageclick: true
      })
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
} 