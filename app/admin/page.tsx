"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, LogOut, Users, Eye, GraduationCap, LineChart } from "lucide-react"
import Link from "next/link"
import { isAuthenticated, logout } from "../../lib/auth"
import { ThemeToggle } from "../../components/theme-toggle"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Department of AIML, DJSCE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, Admin</h2>
            <p className="text-muted-foreground">Manage AIML placement experiences from here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Add Experience</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create a new placement experience for AIML 26 students.</p>
                <Button asChild className="w-full">
                  <Link href="/editor">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Experience
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>View Public Site</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See how the public site looks to visitors.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <Eye className="w-4 h-4 mr-2" />
                    View AIML 26
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>AIML 25 Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">View placement experiences from AIML 25 batch.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/aiml-25">
                    <Users className="w-4 h-4 mr-2" />
                    View AIML 25
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Manage Batches</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Add new batches and manage existing ones.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/batches">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Manage Batches
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>View Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See website usage analytics from PostHog.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/analytics">
                    <LineChart className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
