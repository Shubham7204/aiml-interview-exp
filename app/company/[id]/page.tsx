"use client"

import React, { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCompanyById, getExperiencesByCompany, getBatches } from "../../../lib/database"
import { isAuthenticated } from "../../../lib/auth"
import { ThemeToggle } from "../../../components/theme-toggle"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink, MapPin, Users, PlusCircle, Calendar } from "lucide-react"
import type { Company, Experience, Batch } from "../../../types/company"

interface CompanyPageProps {
  params: Promise<{ id: string }>
}

export default function CompanyPage({ params }: CompanyPageProps) {
  const { id } = React.use(params)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAuthenticated())

    async function loadData() {
      try {
        const [companyData, companyExperiences, allBatches] = await Promise.all([
          getCompanyById(id),
          getExperiencesByCompany(id),
          getBatches(),
        ])
        setCompany(companyData)
        setExperiences(companyExperiences)
        setBatches(allBatches)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading experiences...</div>
          <p className="text-muted-foreground mt-2">Please wait while we fetch company experiences.</p>
        </div>
      </div>
    )
  }

  if (!company) {
    notFound()
  }

  // Group experiences by batch
  const experiencesByBatch = experiences.reduce(
    (acc, experience) => {
      const batchId = experience.batchId
      if (!acc[batchId]) {
        acc[batchId] = []
      }
      acc[batchId].push(experience)
      return acc
    },
    {} as Record<string, Experience[]>,
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild className="px-2 sm:px-4">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button asChild size="sm" className="sm:h-9 sm:px-4">
                  <Link href={`/editor?company=${company.id}`}>
                    <PlusCircle className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add Experience</span>
                    <span className="sm:hidden">Add</span>
                  </Link>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Company Header */}
        <Card className="mb-8">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded-xl p-3 shadow-sm border shrink-0 flex items-center justify-center">
                <Image
                  src={company.logo || "/placeholder.svg"}
                  alt={`${company.name} logo`}
                  width={72}
                  height={72}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{company.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed break-words">{company.description}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs sm:text-sm py-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {company.industry}
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm py-1">
                    <Users className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {experiences.length} Experience{experiences.length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="text-xs sm:text-sm py-1">
                    <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />
                    {Object.keys(experiencesByBatch).length} Batch
                    {Object.keys(experiencesByBatch).length !== 1 ? "es" : ""}
                  </Badge>
                </div>
                {company.website && (
                  <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiences Section */}
        {experiences.length > 0 ? (
          <div className="space-y-8">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
                {company.name} Interview Experiences ({experiences.length})
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Real interview experiences shared by AIML students across different batches
              </p>
            </div>

            {/* Group experiences by batch */}
            {batches
              .filter((batch) => experiencesByBatch[batch.id])
              .map((batch) => (
                <div key={batch.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">{batch.name}</h3>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {experiencesByBatch[batch.id].length} Experience
                      {experiencesByBatch[batch.id].length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid gap-4 sm:gap-6">
                    {experiencesByBatch[batch.id].map((experience) => (
                      <Card key={experience.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="p-4 sm:p-6 pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base sm:text-lg mb-1.5 break-words line-clamp-2">
                                {experience.title}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                                <span>Role: {experience.role}</span>
                                <span>•</span>
                                <span>By {experience.author}</span>
                                <span>•</span>
                                <span>{batch.name}</span>
                              </div>
                            </div>
                            <Button size="sm" asChild className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                              <Link href={`/experience/${experience.id}`}>Read More</Link>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {experience.tags?.filter(tag => tag !== "Technical Round" && tag !== "HR Round").map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div
                            className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed break-words"
                            dangerouslySetInnerHTML={{
                              __html: experience.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 180) + "...",
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Add separator between batches except for the last one */}
                  {batch.id !== batches.filter((b) => experiencesByBatch[b.id]).slice(-1)[0]?.id && (
                    <Separator className="my-6 sm:my-8" />
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">{company.name} Experiences</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">No experiences shared yet for this company</p>
            {isAdmin && (
              <Button asChild>
                <Link href={`/editor?company=${company.id}`}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Share Your Experience
                </Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
