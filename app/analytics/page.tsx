"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "../../lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, LineChart, Users, Clock, Monitor, TrendingUp } from "lucide-react"
import { AnalyticsTracking } from "../analytics-tracking"

interface AnalyticsData {
  totalVisitors: number
  totalPageviews: number
  avgSessionDuration: number
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalVisitors: 0,
    totalPageviews: 0,
    avgSessionDuration: 0,
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 }
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    // Test PostHog event capture
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.posthog) {
        // @ts-ignore
        window.posthog.capture('analytics_page_visited', {
          timestamp: new Date().toISOString(),
          page: 'analytics'
        })
      }
    }
    
    // Fetch analytics data from our API endpoint
    const fetchAnalyticsData = async () => {
      try {
        setError(null)
        const response = await fetch('/api/analytics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setAnalyticsData(data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to fetch analytics data')
          console.error('Analytics API error:', errorData)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        setError('Failed to fetch analytics data')
      }
    }

    if (!loading) {
      fetchAnalyticsData()
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnalyticsTracking />
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              PostHog Analytics
            </h1>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalVisitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Unique users (last 30 days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pageviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalPageviews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Page visits (last 30 days)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(analyticsData.avgSessionDuration / 60)}m {analyticsData.avgSessionDuration % 60}s
              </div>
              <p className="text-xs text-muted-foreground">
                Time on site
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.deviceBreakdown.desktop}%</div>
              <p className="text-xs text-muted-foreground">
                Desktop users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Device Breakdown Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Device Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analyticsData.deviceBreakdown.desktop}%</div>
                <p className="text-sm text-muted-foreground">Desktop</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analyticsData.deviceBreakdown.mobile}%</div>
                <p className="text-sm text-muted-foreground">Mobile</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analyticsData.deviceBreakdown.tablet}%</div>
                <p className="text-sm text-muted-foreground">Tablet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PostHog Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your complete PostHog analytics dashboard is displayed below.
            </p>
            <div className="border rounded-md overflow-hidden">
              <iframe 
                width="100%" 
                height="600" 
                frameBorder="0" 
                allowFullScreen 
                src="https://us.posthog.com/embedded/pcGcvnFDa5RWZ7q3p_YsjpvWv3hEcw"
                className="w-full"
                title="PostHog Analytics Dashboard"
              />
            </div>
            <div className="text-center mt-4">
              <Button asChild variant="outline" size="sm">
                <a 
                  href="https://us.i.posthog.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <LineChart className="w-4 h-4" />
                  Open Full Dashboard
                </a>
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Opens in a new tab if iframe doesn't load
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}