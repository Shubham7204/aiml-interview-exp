"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isAuthenticated, logout } from "../../lib/auth"
import { useRouter } from "next/navigation"
import { PlusCircle, Users, LogOut, Eye } from "lucide-react"
import Link from "next/link"
import { Footer } from "../../components/footer"

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Loading admin panel...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Department of AIML, DJSCE</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Experience Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Add Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create a new placement experience for AIML 26 students.</p>
              <Button asChild className="w-full">
                <Link href="/editor">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create New Experience
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* View Public Site Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                View Public Site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">See how the site appears to public visitors.</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">
                  <Eye className="w-4 h-4 mr-2" />
                  View AIML 26 Site
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* AIML 25 Experiences Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                AIML 25 Experiences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Browse placement experiences from the previous batch.</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/aiml-25">
                  <Users className="w-4 h-4 mr-2" />
                  View AIML 25
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">Welcome to the admin panel. You can manage placement experiences from here.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
