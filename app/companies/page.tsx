"use client"

import { useEffect, useState } from "react"
import { companies as companyData } from "../../data/companies"
import { getExperiences } from "../../lib/database"
import { CompanyCard } from "../../components/company-card"
import type { Company, Experience } from "../../types/company"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const allExperiences = await getExperiences()
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
          All Companies
        </h1>
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
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} experiences={experiences} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}