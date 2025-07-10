"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CompanyCard } from "../../components/company-card"
import { companies } from "../../data/companies"
import { getExperiences } from "../../lib/database"
import { isAuthenticated, logout } from "../../lib/auth"
import Link from "next/link"
import { PlusCircle, Users, LogOut } from "lucide-react"
import type { Company } from "../../types/company"

export default function AdminPage() {
  const [companiesWithExperiences, setCompaniesWithExperiences] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)

    async function loadExperiences() {
      try {
        const experiences = await getExperiences()
        const experienceCounts = experiences.reduce(
          (acc, exp) => {
            acc[exp.companyId] = (acc[exp.companyId] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const updatedCompanies = companies.map((company) => ({
          ...company,
          experienceCount: experienceCounts[company.id] || 0,
        }))

        setCompaniesWithExperiences(updatedCompanies)
      } catch (error) {
        console.error("Error loading experiences:", error)
      } finally {
        setLoading(false)
      }
    }

    loadExperiences()
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Checking authentication...</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Loading experiences...</div>
          <p className="text-gray-500 mt-2">Please wait while we fetch the latest experiences.</p>
        </div>
      </div>
    )
  }

  const hasAnyExperiences = companiesWithExperiences.some((c) => c.experienceCount > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">AIML 26 Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href="/editor">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Experience
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/">View Public Site</Link>
          </Button>
        </div>

        {hasAnyExperiences ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Placement Experiences</h2>
              <p className="text-gray-600">Add, edit, and manage placement experiences</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companiesWithExperiences
                .filter((company) => company.experienceCount > 0)
                .map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
            <p className="text-gray-600 mb-8">
              No experiences added yet. Start by adding your first placement experience!
            </p>
            <Button size="lg" asChild>
              <Link href="/editor">Add First Experience</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
