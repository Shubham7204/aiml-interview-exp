"use client"

import React, { useState, useEffect } from "react"
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
import { getExperienceById, deleteExperience, getExperienceRounds, getExperienceResources } from "../../../lib/database"
import { isAuthenticated } from "../../../lib/auth"
import { companies } from "../../../data/companies"
import { ThemeToggle } from "../../../components/theme-toggle"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, User, Briefcase, Edit, Trash2, Clock, BookOpen, Lightbulb, ExternalLink, BarChart3, Tag } from "lucide-react"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../types/company"

interface ExperiencePageProps {
  params: Promise<{ id: string }>
}

const roundTypeLabels: Record<string, string> = {
  online_assessment: "Online Assessment",
  technical: "Technical",
  hr: "HR",
  group_discussion: "Group Discussion",
  case_study: "Case Study",
  coding: "Coding",
  other: "Other",
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function ExperiencePage({ params }: ExperiencePageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  const [experience, setExperience] = useState<Experience | null>(null)
  const [rounds, setRounds] = useState<ExperienceRound[]>([])
  const [resources, setResources] = useState<ExperienceResource[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(isAuthenticated())

    async function loadExperience() {
      try {
        const foundExperience = await getExperienceById(id)
        setExperience(foundExperience)

        if (foundExperience) {
          const [fetchedRounds, fetchedResources] = await Promise.all([
            getExperienceRounds(foundExperience.id),
            getExperienceResources(foundExperience.id),
          ])
          setRounds(fetchedRounds)
          setResources(fetchedResources)
        }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading experience...</div>
          <p className="text-muted-foreground mt-2">Please wait while we fetch the experience details.</p>
        </div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Experience not found</div>
          <p className="text-muted-foreground mt-2">The experience you're looking for doesn't exist.</p>
          <Button asChild className="mt-4">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const company = companies.find((c) => c.id === experience.companyId)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href={company ? `/company/${company.id}` : "/"}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {company?.name || "Home"}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
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
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
                  <h1 className="text-3xl font-bold text-foreground mb-3">{experience.title}</h1>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                    {experience.ctc && (
                      <div className="flex items-center gap-1">
                        <span>
                          <strong>CTC:</strong> ₹{experience.ctc % 1 === 0 ? experience.ctc.toFixed(0) : experience.ctc.toFixed(1)} LPA
                        </span>
                      </div>
                    )}
                    {experience.offerType && (
                      <div className="flex items-center gap-1">
                        <span>
                          <strong>Offer Type:</strong> {experience.offerType}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* New metadata badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {experience.experienceType && (
                      <Badge variant="outline" className="capitalize">
                        {experience.experienceType}
                      </Badge>
                    )}
                    {experience.difficulty && (
                      <Badge className={difficultyColors[experience.difficulty]}>
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1)} Difficulty
                      </Badge>
                    )}
                    {experience.duration && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {experience.duration}
                      </Badge>
                    )}
                  </div>

                  {/* Topic tags */}
                  {experience.topicsCovered && experience.topicsCovered.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Tag className="w-4 h-4 text-muted-foreground mr-1" />
                      {experience.topicsCovered.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interview Rounds */}
            {rounds.length > 0 && (
              <div className="mb-8 pb-6 border-b">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Interview Rounds
                </h2>
                <div className="space-y-4">
                  {rounds.map((round, index) => (
                    <div key={round.id} className="relative pl-8 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {index < rounds.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{round.roundNumber}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{round.roundName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {roundTypeLabels[round.roundType] || round.roundType}
                          </Badge>
                          {round.duration && (
                            <span className="text-xs text-muted-foreground">• {round.duration}</span>
                          )}
                        </div>
                        {round.topics && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Topics:</strong> {round.topics}
                          </p>
                        )}
                        {round.description && (
                          <p className="text-sm text-foreground/80 mt-2">{round.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Content */}
            <div
              className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert mx-auto"
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
              }}
              dangerouslySetInnerHTML={{
                __html: experience.content,
              }}
            />

            {/* Tips & Advice */}
            {experience.tips && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Tips & Advice
                </h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4">
                  <p className="text-foreground/80 whitespace-pre-wrap">{experience.tips}</p>
                </div>
              </div>
            )}

            {/* Preparation Resources */}
            {resources.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Preparation Resources
                </h2>
                <ul className="space-y-2">
                  {resources.map((resource) => (
                    <li key={resource.id} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {resource.resourceLink ? (
                        <a
                          href={resource.resourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {resource.resourceName}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-foreground">{resource.resourceName}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
