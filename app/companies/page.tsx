"use client"

import { useState, useEffect } from "react"
import { CompanyCard } from "../../components/company-card"
import { companies } from "../../data/companies"
import { getExperiences, getBatches, getBatchByYear } from "../../lib/database"
import { Menu, X, Building2 } from "lucide-react"
import type { Company, Batch } from "../../types/company"
import { Footer } from "../../components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CompaniesPage() {
  const [companiesWithExperiences, setCompaniesWithExperiences] = useState<Company[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Load batches first
        const fetchedBatches = await getBatches()
        const activeBatches = fetchedBatches.filter((batch) => batch.isActive)
        setBatches(activeBatches)

        // Set default batch to 2026 (AIML 26) or first active batch
        const defaultBatch = (await getBatchByYear(2026)) || activeBatches[0]
        if (defaultBatch) {
          setSelectedBatch(defaultBatch)
        }

        // Load experiences
        const experiences = await getExperiences()

        // Filter experiences by selected batch and count by company
        const batchExperiences = defaultBatch ? experiences.filter((exp) => exp.batchId === defaultBatch.id) : []

        const experienceCounts = batchExperiences.reduce(
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
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    async function updateExperienceCounts() {
      if (!selectedBatch) return

      try {
        const experiences = await getExperiences()
        const batchExperiences = experiences.filter((exp) => exp.batchId === selectedBatch.id)

        const experienceCounts = batchExperiences.reduce(
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
        console.error("Error updating experience counts:", error)
      }
    }

    updateExperienceCounts()
  }, [selectedBatch])

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (batch) {
      setSelectedBatch(batch)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Loading companies...</div>
          <p className="text-gray-500 mt-2">Please wait while we fetch the company data.</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  All Companies - {selectedBatch ? selectedBatch.name : "AIML"}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Department of AIML, DJSCE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                Home
              </Link>
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
                href="/"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
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
        {/* Batch Selector */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Select Batch:</span>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedBatch?.id || ""} onValueChange={handleBatchChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name} ({batch.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              All Companies - {selectedBatch ? selectedBatch.name : "AIML"}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Browse all companies with interview experiences from {selectedBatch ? selectedBatch.name : "AIML"}{" "}
              students
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {companiesWithExperiences.map((company) => (
              <CompanyCard key={company.id} company={company} batchId={selectedBatch?.id} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
