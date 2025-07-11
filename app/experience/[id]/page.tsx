"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getExperienceById, deleteExperience } from "../../../lib/database"
import { isAuthenticated } from "../../../lib/auth"
import { companies } from "../../../data/companies"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, User, Briefcase, Edit, Trash2 } from "lucide-react"
import type { Experience } from "../../../types/company"

interface ExperiencePageProps {
  params: { id: string }
}

export default function ExperiencePage({ params }: ExperiencePageProps) {
  const { id } = params
  const router = useRouter()
  const [experience, setExperience] = useState<Experience | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAuthenticated())

    async function loadExperience() {
      try {
        const foundExperience = await getExperienceById(id)
        setExperience(foundExperience)
      } catch (error) {
        console.error("Error loading experience:", error)
      } finally {
        setLoading(false)
      }
    }

    loadExperience()
  }, [id])

  const handleDelete = async () => {
    if (!experience) return

    setIsDeleting(true)
    try {
      await deleteExperience(experience.id)
      router.push(`/company/${experience.companyId}`)
    } catch (error) {
      console.error("Error deleting experience:", error)
      alert("Error deleting experience. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Loading experience...</div>
          <p className="text-gray-500 mt-2">Please wait while we fetch the experience details.</p>
        </div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Experience not found</div>
          <p className="text-gray-500 mt-2">The experience you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const company = companies.find((c) => c.id === experience.companyId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href={company ? `/company/${company.id}` : "/"}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {company?.name || "Home"}
              </Link>
            </Button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/editor/${experience.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Experience</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this interview experience? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-8">
            {/* Experience Header */}
            <div className="mb-8 pb-6 border-b">
              <div className="flex items-start gap-4 mb-4">
                {company && (
                  <Image
                    src={company.logo || "/placeholder.svg"}
                    alt={`${company.name} logo`}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{experience.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>
                        <strong>Company:</strong> {company?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span>
                        <strong>Role:</strong> {experience.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>
                        <strong>Candidate:</strong> {experience.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>
                        <strong>Status:</strong>
                        <Badge
                          variant={experience.selectionStatus === "selected" ? "default" : "secondary"}
                          className="ml-1"
                        >
                          {experience.selectionStatus === "selected" ? "Selected" : "Not Selected"}
                        </Badge>
                      </span>
                    </div>
                    {experience.selectionStatus === "selected" && experience.ctc && (
                      <div className="flex items-center gap-1">
                        <span>
                          <strong>CTC:</strong> ₹{experience.ctc} LPA
                        </span>
                      </div>
                    )}
                    {experience.selectionStatus === "selected" && experience.offerType && (
                      <div className="flex items-center gap-1">
                        <span>
                          <strong>Offer Type:</strong> {experience.offerType}
                        </span>
                      </div>
                    )}
                  </div>
                  {experience.duration && (
                    <div className="mt-2">
                      <Badge variant="outline">Interview Period: {experience.duration}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Experience Content */}
            <div
              className="prose max-w-none"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
              }}
              dangerouslySetInnerHTML={{
                __html: experience.content,
              }}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
