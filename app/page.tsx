"use client"

import { useState, useEffect } from "react"
import { CompanyCard } from "../components/company-card"
import { companies } from "../data/companies"
import { getExperiences } from "../lib/database"
import { Users, Menu, X } from "lucide-react"
import type { Company } from "../types/company"
import { Footer } from "../components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const [companiesWithExperiences, setCompaniesWithExperiences] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
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
  }, [])

  const hasAnyExperiences = companiesWithExperiences.some((c) => c.experienceCount > 0)

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src="/djsce-logo.png"
                alt="DJSCE Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">AIML 26 Placement Experiences</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Department of AIML, DJSCE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/aiml-25"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                AIML 25 Experiences
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <Link
                href="/aiml-25"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                AIML 25 Experiences
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {hasAnyExperiences ? (
          <div className="space-y-6">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Interview Experiences</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Browse real interview experiences shared by AIML 26 students
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {companiesWithExperiences
                .filter((company) => company.experienceCount > 0)
                .map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">AIML 26 Placement Experiences</h2>
            <p className="text-gray-600 mb-8 text-sm sm:text-base px-4">
              Interview experiences will be shared here soon. Check back later for insights from your classmates!
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
