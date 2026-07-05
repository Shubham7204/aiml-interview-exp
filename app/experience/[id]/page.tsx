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
            <Button variant="ghost" asChild className="px-2 sm:px-4">
              <Link href={company ? `/company/${company.id}` : "/"}>
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to {company?.name || "Company"}</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" asChild className="h-8 sm:h-9">
                    <Link href={`/editor/${experience.id}`}>
                      <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8 sm:h-9">
                        <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-lg">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-8">
            {/* Experience Header */}
            <div className="mb-6 sm:mb-8 pb-6 border-b">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                {company && (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-background rounded-lg border p-2 flex items-center justify-center shrink-0">
                    <Image
                      src={company.logo || "/placeholder.svg"}
                      alt={`${company.name} logo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-3 break-words leading-snug">
                    {experience.title}
                  </h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Company:</strong> {company?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Role:</strong> {experience.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Candidate:</strong> {experience.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>
                        <strong>Status:</strong>
                        <Badge
                          variant={experience.selectionStatus === "selected" ? "default" : "secondary"}
                          className="ml-1 text-[10px] py-0 px-1.5"
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
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3.5">
                    {experience.experienceType && (
                      <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                        {experience.experienceType}
                      </Badge>
                    )}
                    {experience.difficulty && (
                      <Badge className={`${difficultyColors[experience.difficulty]} text-[10px] sm:text-xs`}>
                        <BarChart3 className="w-3 h-3 mr-1 shrink-0" />
                        {experience.difficulty.charAt(0).toUpperCase() + experience.difficulty.slice(1)} Difficulty
                      </Badge>
                    )}
                    {experience.duration && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        {experience.duration}
                      </Badge>
                    )}
                  </div>

                  {/* Topic tags */}
                  {experience.topicsCovered && experience.topicsCovered.length > 0 && (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground mr-1 self-center shrink-0" />
                      {experience.topicsCovered.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-[10px] sm:text-xs font-normal">
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
              <div className="mb-6 sm:mb-8 pb-6 border-b">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Interview Rounds
                </h2>
                <div className="space-y-4">
                  {rounds.map((round, index) => (
                    <div key={round.id} className="relative pl-7 sm:pl-8 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {index < rounds.length - 1 && (
                        <div className="absolute left-[9px] sm:left-[11px] top-7 sm:top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-primary">{round.roundNumber}</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground break-words">{round.roundName}</h3>
                          <Badge variant="outline" className="text-[10px] sm:text-xs py-0">
                            {roundTypeLabels[round.roundType] || round.roundType}
                          </Badge>
                          {round.duration && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">• {round.duration}</span>
                          )}
                        </div>
                        {round.topics && (
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
                            <strong>Topics:</strong> {round.topics}
                          </p>
                        )}
                        {round.description && (
                          <p className="text-xs sm:text-sm text-foreground/80 mt-2 break-words leading-relaxed">{round.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Content */}
            <div
              className="prose prose-sm sm:prose max-w-none dark:prose-invert mx-auto break-words leading-relaxed"
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
              }}
              dangerouslySetInnerHTML={{
                __html: experience.content,
              }}
            />

            {/* Tips & Advice */}
            {experience.tips && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                  Tips & Advice
                </h2>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4">
                  <p className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">{experience.tips}</p>
                </div>
              </div>
            )}

            {/* Preparation Resources */}
            {resources.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
                  Preparation Resources
                </h2>
                <ul className="space-y-2">
                  {resources.map((resource) => (
                    <li key={resource.id} className="flex items-start gap-2 text-xs sm:text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                      <div className="min-w-0 flex-1 break-words">
                        {resource.resourceLink ? (
                          <a
                            href={resource.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 max-w-full"
                          >
                            <span className="truncate">{resource.resourceName}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-foreground">{resource.resourceName}</span>
                        )}
                      </div>
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
