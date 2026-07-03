"use client"

import { useEffect, useState } from "react"
import { getCompanies, getExperiences } from "../../lib/database"
import { CompanyCard } from "../../components/company-card"
import type { Company, Experience } from "../../types/company"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchData() {
      const [allExperiences, companyData] = await Promise.all([getExperiences(), getCompanies()])
      const companiesWithCounts = companyData.map((company) => ({
          ...company,
        experienceCount: allExperiences.filter((exp) => exp.companyId === company.id).length,
      }))
      setCompanies(companiesWithCounts)
      setExperiences(allExperiences)
        setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
       <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href={`/`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              </Button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </span>
            <Input
              type="text"
              placeholder="Search companies..."
              className="pl-10 py-2 text-base md:text-sm"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
               <div key={i} className="bg-card p-4 rounded-lg shadow-md animate-pulse">
                <div className="h-24 bg-muted rounded-md"></div>
                <div className="mt-4 h-6 bg-muted rounded-md w-3/4"></div>
                <div className="mt-2 h-4 bg-muted rounded-md w-1/2"></div>
            </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies
              .filter(company =>
                company.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((company) => (
                <CompanyCard key={company.id} company={company} experiences={experiences} />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
