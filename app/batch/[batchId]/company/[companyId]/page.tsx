"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { companies } from "../../../../../data/companies"
import { getExperiencesByBatchAndCompany, getBatchById } from "../../../../../lib/database"
import { isAuthenticated } from "../../../../../lib/auth"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ExternalLink, MapPin, Users, PlusCircle } from "lucide-react"
import type { Experience, Batch } from "../../../../../types/company"

interface BatchCompanyPageProps {
  params: { batchId: string; companyId: string }
}

export default function BatchCompanyPage({ params }: BatchCompanyPageProps) {
  const { batchId, companyId } = params
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [batch, setBatch] = useState<Batch | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAuthenticated())

    async function loadData() {
      try {
        const [batchData, experienceData] = await Promise.all([
          getBatchById(batchId),
          getExperiencesByBatchAndCompany(batchId, companyId),
        ])

        setBatch(batchData)
        setExperiences(experienceData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [batchId, companyId])

  const company = companies.find((c) => c.id === companyId)

  if (!company) {
    notFound()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Loading experiences...</div>
          <p className="text-gray-500 mt-2">Please wait while we fetch {company.name} experiences.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild>
                <Link href={`/editor?batch=${batchId}&company=${companyId}`}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Experience
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-white rounded-xl p-3 shadow-sm border">
                <Image
                  src={company.logo || "/placeholder.svg"}
                  alt={`${company.name} logo`}
                  width={72}
                  height={72}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{company.description}</p>
                <div className="flex flex-wrap gap-4 mb-4">
                  <Badge variant="secondary" className="text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {company.industry}
                  </Badge>
                  {batch && (
                    <Badge variant="outline" className="text-sm">
                      {batch.name} ({batch.year})
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {experiences.length} Experience{experiences.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {company.website && (
                  <Button variant="outline" asChild>
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
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {company.name} Interview Experiences ({experiences.length})
              </h2>
              <p className="text-gray-600">Real interview experiences shared by {batch?.name || "AIML"} students</p>
            </div>

            {/* Experience Cards */}
            <div className="grid gap-6">
              {experiences.map((experience) => (
                <Card key={experience.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{experience.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Role: {experience.role}</span>
                          <span>•</span>
                          <span>By {experience.author}</span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/experience/${experience.id}`}>Read More</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {experience.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div
                      className="text-sm text-gray-600 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: experience.content.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {company.name} Experiences - {batch?.name || "AIML"}
            </h2>
            <p className="text-gray-600 mb-8">No experiences shared yet for this company and batch</p>
            {isAdmin && (
              <Button asChild>
                <Link href={`/editor?batch=${batchId}&company=${companyId}`}>
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
