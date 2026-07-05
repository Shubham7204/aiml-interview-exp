"use client"

import { useState, useEffect } from "react"
import { CompanyCard } from "../components/company-card"
import { getCompanies, getExperiences, getBatches, getBatchByYear } from "../lib/database"
import { Building2, Users, Search, GraduationCap, Menu, PenLine } from "lucide-react"
import type { Company, Batch, Experience } from "../types/company"
import { Footer } from "../components/footer"
import { ThemeToggle } from "../components/theme-toggle"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { PageTracking } from "./page-tracking"

export default function HomePage() {
  const [viewMode, setViewMode] = useState("companies") // 'companies' or 'people'
  const [allExperiences, setAllExperiences] = useState<Experience[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([])
  const [companiesWithExperiences, setCompaniesWithExperiences] = useState<Company[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedBatches, fetchedExperiences, fetchedCompanies] = await Promise.all([
          getBatches(),
          getExperiences(),
          getCompanies(),
        ])

        const activeBatches = fetchedBatches.filter((batch) => batch.isActive)
        setBatches(activeBatches)
        setAllExperiences(fetchedExperiences)
        setCompanies(fetchedCompanies)

        const defaultBatch = (await getBatchByYear(2027)) || activeBatches[0]
        if (defaultBatch) {
          setSelectedBatch(defaultBatch)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
      if (!selectedBatch) return

    // Filter experiences by batch
    const batchExperiences = allExperiences.filter((exp) => exp.batchId === selectedBatch.id)

    // Update company experience counts
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

    // Filter companies and people based on search term
    const lowercasedFilter = searchTerm.toLowerCase()

    if (viewMode === "companies") {
      const filtered = updatedCompanies.filter((company) => company.name.toLowerCase().includes(lowercasedFilter))
      setCompaniesWithExperiences(filtered)
    } else {
      const filtered = batchExperiences.filter((exp) => exp.author.toLowerCase().includes(lowercasedFilter))
      setFilteredExperiences(filtered)
    }
  }, [selectedBatch, searchTerm, allExperiences, viewMode, companies])

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId)
    if (batch) {
      setSelectedBatch(batch)
    }
  }

  const getCompany = (companyId: string) => {
    return companies.find((c) => c.id === companyId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading data...</div>
          <p className="text-muted-foreground mt-2">Please wait while we fetch the required data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageTracking />
      <header className="bg-card shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="h-8 w-auto" />
              <span className="font-semibold text-lg text-foreground hidden sm:block">
                AIML Placement Experiences
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/aiml-25"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                AIML-25 (PDF)
              </Link>
              <Link
                href="/submit"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Submit Experience
              </Link>
              <Link
                href="/companies"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Building2 className="w-4 h-4" />
                All Companies
              </Link>
              <ThemeToggle />
            </nav>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <ThemeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="ml-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <nav className="flex flex-col gap-6 pt-8">
                    <Link href="/" className="flex items-center gap-2 mb-4">
                      <img src="/djsce-logo.png" alt="DJSCE Logo" className="h-8 w-auto" />
                      <span className="font-semibold">Home</span>
                    </Link>
                    <Link
                      href="/aiml-25"
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <GraduationCap className="w-5 h-5 mr-2" />
                      AIML-25
                    </Link>
                    <Link
                      href="/submit"
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <PenLine className="w-5 h-5 mr-2" />
                      Submit Experience
                    </Link>
                    <Link
                      href="/companies"
                      className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <Building2 className="w-5 h-5 mr-2" />
                      All Companies
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Find real interview experiences by students from the{" "}
            {selectedBatch ? selectedBatch.name : "AIML"} batch.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value)
            }}
            className="w-full md:w-auto"
          >
            <ToggleGroupItem value="companies" className="flex-1">
              <Building2 className="w-4 h-4 mr-2" />
              Companies
            </ToggleGroupItem>
            <ToggleGroupItem value="people" className="flex-1">
              <Users className="w-4 h-4 mr-2" />
              People
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={viewMode === "companies" ? "Search for a company..." : "Search for a person..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
            </div>
          <div className="w-full md:w-48">
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

        {viewMode === "companies" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {companiesWithExperiences
              .filter((c) => c.experienceCount > 0)
              .map((company) => {
                const batchExperiences = allExperiences.filter((exp) => exp.batchId === selectedBatch?.id)
                return (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    batchId={selectedBatch?.id}
                    experiences={batchExperiences}
                  />
                )
              })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.length > 0 ? (
              filteredExperiences.map((experience) => {
                const company = getCompany(experience.companyId)
                return (
                  <Card key={experience.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{experience.author}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {experience.role} at {company?.name}
                          </p>
                        </div>
                        {company && (
                           <Image
                            src={company.logo || "/placeholder.svg"}
                            alt={`${company.name} logo`}
                            width={40}
                            height={40}
                            className="rounded-lg border p-1"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow" />
                    <CardFooter className="flex justify-between items-end">
                      <div>
                        {experience.selectionStatus &&
                            <div className="text-sm font-medium text-foreground capitalize">
                                {experience.selectionStatus?.replace(/_/g, " ")}
                            </div>
                        }
                        {experience.ctc && (
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                                ₹ {experience.ctc % 1 === 0 ? experience.ctc.toFixed(0) : experience.ctc.toFixed(1)} LPA
                            </div>
                        )}
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/experience/${experience.id}`}>Read More</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-12 col-span-full">
                <p className="text-muted-foreground">No experiences found for "{searchTerm}" in this batch.</p>
            </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
