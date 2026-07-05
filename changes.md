"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { isAuthenticated } from "../../../lib/auth"
import {
  getAllExperiencesForAdmin,
  updateExperienceStatus,
  deleteExperience,
  getExperienceRounds,
  getExperienceResources,
} from "../../../lib/database"
import { companies } from "../../../data/companies"
import { ThemeToggle } from "../../../components/theme-toggle"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../types/company"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Calendar,
  FileText,
  BookOpen,
  Lightbulb,
  ExternalLink,
} from "lucide-react"

// ============================================
// Helpers
// ============================================

const getCompanyName = (companyId: string) =>
  companies.find((c) => c.id === companyId)?.name || companyId

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html
  const tmp = document.createElement("div")
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type StatusType = Experience["status"]

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  },
  approved: {
    label: "Approved",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  },
  needs_revision: {
    label: "Needs Revision",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
  },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  easy: { label: "Easy", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  hard: { label: "Hard", variant: "destructive" },
}

const ROUND_TYPE_LABELS: Record<string, string> = {
  online_assessment: "Online Assessment",
  technical: "Technical",
  hr: "HR",
  group_discussion: "Group Discussion",
  case_study: "Case Study",
  coding: "Coding",
  other: "Other",
}

// ============================================
// Submission Card Component
// ============================================

function SubmissionCard({
  experience,
  onStatusUpdate,
  onDelete,
}: {
  experience: Experience
  onStatusUpdate: (id: string, status: StatusType, note?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [rounds, setRounds] = useState<ExperienceRound[]>([])
  const [resources, setResources] = useState<ExperienceResource[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsLoaded, setDetailsLoaded] = useState(false)

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const statusConfig = STATUS_CONFIG[experience.status]
  const plainContent = stripHtml(experience.content || "")
  const previewContent = plainContent.length > 200 ? plainContent.slice(0, 200) + "…" : plainContent

  const handleExpand = useCallback(async () => {
    const willExpand = !expanded
    setExpanded(willExpand)

    if (willExpand && !detailsLoaded) {
      setLoadingDetails(true)
      try {
        const [roundsData, resourcesData] = await Promise.all([
          getExperienceRounds(experience.id),
          getExperienceResources(experience.id),
        ])
        setRounds(roundsData)
        setResources(resourcesData)
        setDetailsLoaded(true)
      } catch (err) {
        console.error("Error loading details:", err)
      } finally {
        setLoadingDetails(false)
      }
    }
  }, [expanded, detailsLoaded, experience.id])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await onStatusUpdate(experience.id, "approved")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await onStatusUpdate(experience.id, "rejected", feedbackText || undefined)
      setRejectDialogOpen(false)
      setFeedbackText("")
    } finally {
      setActionLoading(false)
    }
  }

  const handleNeedsRevision = async () => {
    setActionLoading(true)
    try {
      await onStatusUpdate(experience.id, "needs_revision", feedbackText || undefined)
      setRevisionDialogOpen(false)
      setFeedbackText("")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await onDelete(experience.id)
      setDeleteDialogOpen(false)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <Card className="border transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground truncate">
                  {experience.author}
                </span>
                {experience.sapId && (
                  <span className="text-sm text-muted-foreground">
                    ({experience.sapId})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{getCompanyName(experience.companyId)}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{experience.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Badge
                variant="outline"
                className={`${statusConfig.bgColor} ${statusConfig.color} border`}
              >
                {statusConfig.label}
              </Badge>
              {experience.experienceType && (
                <Badge variant="secondary" className="capitalize">
                  {experience.experienceType}
                </Badge>
              )}
              {experience.difficulty && (
                <Badge variant={DIFFICULTY_CONFIG[experience.difficulty]?.variant || "outline"}>
                  {DIFFICULTY_CONFIG[experience.difficulty]?.label || experience.difficulty}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(experience.createdAt)}</span>
            </div>
            {experience.batch && (
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>{experience.batch.name}</span>
              </div>
            )}
            {experience.selectionStatus && (
              <Badge
                variant={experience.selectionStatus === "selected" ? "default" : "outline"}
                className="text-xs"
              >
                {experience.selectionStatus === "selected" ? "Selected" : "Not Selected"}
              </Badge>
            )}
            {experience.ctc && (
              <span className="font-medium">₹{experience.ctc} LPA</span>
            )}
          </div>

          {/* Topic tags */}
          {experience.topicsCovered && experience.topicsCovered.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {experience.topicsCovered.map((topic, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-normal px-2 py-0.5">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Preview */}
          {!expanded && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {previewContent || "No content available."}
            </p>
          )}

          {/* Admin review note */}
          {experience.adminReviewNote && (
            <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Admin Review Note
                </span>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                {experience.adminReviewNote}
              </p>
            </div>
          )}

          {/* Expanded content */}
          {expanded && (
            <div className="space-y-4 pt-2 border-t">
              {/* Full content */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Full Content
                </h4>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed bg-muted/30 rounded-md p-4"
                  dangerouslySetInnerHTML={{ __html: experience.content || "" }}
                />
              </div>

              {/* Tips */}
              {experience.tips && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Tips
                  </h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
                    {experience.tips}
                  </div>
                </div>
              )}

              {/* Loading state for rounds/resources */}
              {loadingDetails && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading details...</span>
                </div>
              )}

              {/* Interview Rounds */}
              {detailsLoaded && rounds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Interview Rounds ({rounds.length})
                  </h4>
                  <div className="space-y-3">
                    {rounds.map((round) => (
                      <div
                        key={round.id}
                        className="flex gap-3 items-start"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                          {round.roundNumber}
                        </div>
                        <div className="flex-1 min-w-0 bg-muted/30 rounded-md p-3 border">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm text-foreground">
                              {round.roundName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ROUND_TYPE_LABELS[round.roundType] || round.roundType}
                            </Badge>
                            {round.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {round.duration}
                              </span>
                            )}
                          </div>
                          {round.topics && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <strong>Topics:</strong> {round.topics}
                            </p>
                          )}
                          {round.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {round.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preparation Resources */}
              {detailsLoaded && resources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Preparation Resources ({resources.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {resources.map((resource) => (
                      <li key={resource.id} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {resource.resourceLink ? (
                          <a
                            href={resource.resourceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {resource.resourceName}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">{resource.resourceName}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailsLoaded && rounds.length === 0 && resources.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No interview rounds or resources attached to this submission.
                </p>
              )}
            </div>
          )}

          {/* Expand/Collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Collapse
                <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Expand
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </CardContent>

        <CardFooter className="border-t pt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
            onClick={handleApprove}
            disabled={actionLoading || experience.status === "approved"}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Approve
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
            onClick={() => {
              setFeedbackText("")
              setRejectDialogOpen(true)
            }}
            disabled={actionLoading || experience.status === "rejected"}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            Reject
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-orange-700 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20"
            onClick={() => {
              setFeedbackText("")
              setRevisionDialogOpen(true)
            }}
            disabled={actionLoading || experience.status === "needs_revision"}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Needs Revision
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 ml-auto"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={actionLoading}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting the submission by{" "}
              <strong>{experience.author}</strong> for{" "}
              <strong>{getCompanyName(experience.companyId)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason (optional)..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? "Rejecting..." : "Reject Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Needs Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Provide feedback for <strong>{experience.author}</strong> on what
              needs to be changed in their submission for{" "}
              <strong>{getCompanyName(experience.companyId)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter revision feedback..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevisionDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleNeedsRevision}
              disabled={actionLoading}
            >
              {actionLoading ? "Sending..." : "Request Revision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the submission by{" "}
              <strong>{experience.author}</strong> for{" "}
              <strong>{getCompanyName(experience.companyId)}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ============================================
// Main Page Component
// ============================================

export default function ModerationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [error, setError] = useState<string | null>(null)

  // Auth check and initial data fetch
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const data = await getAllExperiencesForAdmin()
        setExperiences(data)
      } catch (err) {
        console.error("Error fetching experiences:", err)
        setError("Failed to load submissions. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Filter experiences by tab
  const getFilteredExperiences = (tab: string) => {
    if (tab === "all") return experiences
    return experiences.filter((e) => e.status === tab)
  }

  const counts = {
    all: experiences.length,
    pending: experiences.filter((e) => e.status === "pending").length,
    approved: experiences.filter((e) => e.status === "approved").length,
    rejected: experiences.filter((e) => e.status === "rejected").length,
    needs_revision: experiences.filter((e) => e.status === "needs_revision").length,
  }

  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "rejected" | "needs_revision",
    note?: string
  ) => {
    try {
      const updated = await updateExperienceStatus(id, status, note)
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === id ? updated : exp))
      )
      
      if (updated.authorEmail) {
        try {
          let emailSubject = '';
          let emailHtml = '';

          if (status === "needs_revision") {
            const editLink = `${window.location.origin}/submit/edit/${updated.id}`;
            emailSubject = 'Action Required: Your Interview Experience Needs Revision';
            emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #059669;">Hello ${updated.author},</h2>
                <p>Thank you for submitting your interview experience! The admin has reviewed it and requested a few changes before it can be published.</p>
                <div style="background-color: #fff3cd; color: #856404; padding: 16px; border-radius: 4px; border: 1px solid #ffeeba; margin: 20px 0;">
                  <strong>Admin Note:</strong><br/>
                  ${note || "Please review your submission for missing details."}
                </div>
                <p>Please click the secure link below to edit your submission and fix the requested issues.</p>
                <div style="margin: 30px 0;">
                  <a href="${editLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Edit My Submission</a>
                </div>
                <p style="color: #666; font-size: 12px;">If the button doesn't work, copy this link: ${editLink}</p>
              </div>
            `;
          } else if (status === "approved") {
            const viewLink = `${window.location.origin}/experience/${updated.id}`;
            emailSubject = 'Congratulations! Your Interview Experience is Published';
            emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #059669;">Hello ${updated.author},</h2>
                <p>Great news! Your interview experience for <strong>${getCompanyName(updated.companyId)}</strong> has been approved by the admin and is now live on the platform.</p>
                <p>Your contribution will greatly help your peers and juniors in their preparation. Thank you for sharing!</p>
                <div style="margin: 30px 0;">
                  <a href="${viewLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Post</a>
                </div>
              </div>
            `;
          } else if (status === "rejected") {
            emailSubject = 'Update on Your Interview Experience Submission';
            emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #dc2626;">Hello ${updated.author},</h2>
                <p>Thank you for taking the time to submit your interview experience. Unfortunately, the admin has decided not to publish it at this time.</p>
                ${note ? `
                <div style="background-color: #fee2e2; color: #991b1b; padding: 16px; border-radius: 4px; border: 1px solid #fecaca; margin: 20px 0;">
                  <strong>Admin Note:</strong><br/>
                  ${note}
                </div>
                ` : ''}
                <p>If you have any questions, please reach out to the placement cell.</p>
              </div>
            `;
          }

          if (emailSubject && emailHtml) {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: updated.authorEmail,
                subject: emailSubject,
                html: emailHtml
              })
            });
          }
        } catch (emailError) {
          console.error("Failed to send status update email:", emailError);
          alert("Status updated, but failed to send email to the student.");
        }
      }
    } catch (err) {
      console.error("Error updating status:", err)
      alert("Failed to update status. Please try again.")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExperience(id)
      setExperiences((prev) => prev.filter((exp) => exp.id !== id))
    } catch (err) {
      console.error("Error deleting experience:", err)
      alert("Failed to delete submission. Please try again.")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon">
                <Link href="/admin">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Submission Moderation
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Review and manage student submissions
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {counts.pending}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {counts.approved}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">Approved</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
              {counts.rejected}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">Rejected</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {counts.needs_revision}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-500">Needs Revision</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="flex-1 min-w-[100px]">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 min-w-[100px]">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1 min-w-[100px]">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1 min-w-[100px]">
              Rejected ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="needs_revision" className="flex-1 min-w-[100px]">
              Needs Revision ({counts.needs_revision})
            </TabsTrigger>
          </TabsList>

          {["all", "pending", "approved", "rejected", "needs_revision"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {getFilteredExperiences(tab).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No {tab === "all" ? "" : STATUS_CONFIG[tab as StatusType]?.label.toLowerCase() + " "}submissions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tab === "pending"
                      ? "All caught up! No submissions are waiting for review."
                      : tab === "all"
                      ? "No submissions have been made yet."
                      : `No submissions with "${STATUS_CONFIG[tab as StatusType]?.label}" status.`}
                  </p>
                </div>
              ) : (
                getFilteredExperiences(tab).map((experience) => (
                  <SubmissionCard
                    key={experience.id}
                    experience={experience}
                    onStatusUpdate={handleStatusUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, LogOut, Users, Eye, GraduationCap, LineChart, Upload, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import { isAuthenticated, logout } from "../../lib/auth"
import { ThemeToggle } from "../../components/theme-toggle"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase";
import { getPendingExperiences } from "@/lib/database";

function PDFUploadAdmin() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(""); setError("");
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('important-pdfs').upload(fileName, file);
      if (error) throw error;
      setSuccess("File uploaded successfully!");
      event.target.value = '';
    } catch (err: any) {
      setError("Error uploading file: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept=".pdf"
        onChange={uploadFile}
        disabled={uploading}
        className="hidden"
        id="admin-pdf-upload"
      />
      <Button asChild disabled={uploading} className="cursor-pointer mb-2">
        <label htmlFor="admin-pdf-upload">
          {uploading ? 'Uploading...' : 'Choose PDF File'}
        </label>
      </Button>
      {success && <p className="text-green-600 text-sm mt-1">{success}</p>}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
      getPendingExperiences().then((pending) => setPendingCount(pending.length)).catch(console.error)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Department of AIML, DJSCE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, Admin</h2>
            <p className="text-muted-foreground">Manage AIML placement experiences from here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PDF Upload Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Upload Important PDF</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <PDFUploadAdmin />
          </CardContent>
        </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Add Experience</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create a new placement experience for AIML 26 students.</p>
                <Button asChild className="w-full">
                  <Link href="/editor">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Experience
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>View Public Site</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See how the public site looks to visitors.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <Eye className="w-4 h-4 mr-2" />
                    View AIML 26
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>AIML 25 Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">View placement experiences from AIML 25 batch.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/aiml-25">
                    <Users className="w-4 h-4 mr-2" />
                    View AIML 25
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Manage Batches</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Add new batches and manage existing ones.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/batches">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Manage Batches
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle>Review Submissions</CardTitle>
                  {pendingCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {pendingCount > 0 ? `${pendingCount} submission(s) awaiting review.` : "No pending submissions."}
                </p>
                <Button asChild variant={pendingCount > 0 ? "default" : "outline"} className="w-full">
                  <Link href="/admin/moderation">
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Review Submissions
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>View Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See website usage analytics from PostHog.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/analytics">
                    <LineChart className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}


import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass || pass === 'your_16_digit_app_password_here') {
      console.error('Gmail SMTP not configured properly in .env');
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"AIML Placements" <${user}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Failed to send email via SMTP:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}


"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../../components/company-selector"
import { BatchSelector } from "../../../components/batch-selector"
import { ThemeToggle } from "../../../components/theme-toggle"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Save, Plus, Trash2, FileText
} from "lucide-react"

// Logic
import { 
  getExperienceById, updateExperience,
  getExperienceRounds, deleteExperienceRounds, saveExperienceRounds,
  getExperienceResources, deleteExperienceResources, saveExperienceResources
} from "../../../lib/database"
import { isAuthenticated } from "../../../lib/auth"
import { companies } from "../../../data/companies"
import Link from "next/link"
import NextImage from "next/image"
import DOMPurify from "dompurify"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null
  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

interface EditExperiencePageProps {
  params: Promise<{ id: string }>
}

export default function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  
  const [experience, setExperience] = useState<Experience | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")
  const [status, setStatus] = useState<Experience["status"]>("pending")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[400px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)
    
    async function loadData() {
      try {
        const foundExperience = await getExperienceById(id)
        if (!foundExperience) {
          router.push("/admin")
          return
        }

        setExperience(foundExperience)
        
        // Basic Info
        setAuthor(foundExperience.author || "")
        setSapId(foundExperience.sapId || "")
        setSelectedCompany(foundExperience.companyId || "")
        setSelectedBatch(foundExperience.batchId || "")
        setExperienceType(foundExperience.experienceType || "")
        setRole(foundExperience.role || "")
        setSelectionStatus(foundExperience.selectionStatus || "")
        setCtc(foundExperience.ctc ? String(foundExperience.ctc) : "")
        setOfferType(foundExperience.offerType || "")
        setDuration(foundExperience.duration || "")
        setDifficulty(foundExperience.difficulty || "")
        setTitle(foundExperience.title || "")
        setStatus(foundExperience.status || "pending")
        setTips(foundExperience.tips || "")
        setSelectedTopics(foundExperience.topicsCovered || [])

        // Set Editor content
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(foundExperience.content)
        }

        // Fetch and map Rounds
        const fetchedRounds = await getExperienceRounds(id)
        if (fetchedRounds && fetchedRounds.length > 0) {
          setRounds(fetchedRounds.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextRoundId(fetchedRounds.length + 1)
        }

        // Fetch and map Resources
        const fetchedResources = await getExperienceResources(id)
        if (fetchedResources && fetchedResources.length > 0) {
          setResources(fetchedResources.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextResourceId(fetchedResources.length + 1)
        }

      } catch (error) {
        console.error("Error loading experience details:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id, router, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !experience) return
    
    if (!author || !selectedCompany || !selectedBatch || !role || !selectionStatus || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for the detailed experience.")
      return
    }

    setIsSaving(true)
    try {
      // 1. Update main experience
      await updateExperience({
        ...experience,
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        status, // keep existing status
        sapId: sapId || null,
        experienceType: (experienceType as "internship" | "placement") || null,
        difficulty: (difficulty as "easy" | "medium" | "hard") || null,
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Overwrite rounds (Delete old, insert new)
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      await deleteExperienceRounds(experience.id)
      if (validRounds.length > 0) {
        await saveExperienceRounds(experience.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Overwrite resources (Delete old, insert new)
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      await deleteExperienceResources(experience.id)
      if (validResources.length > 0) {
        await saveExperienceResources(experience.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      alert("Experience updated successfully!")
      router.push(`/experience/${experience.id}`)
    } catch (error) {
      alert("Error updating experience. Please try again.")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">{!authChecked ? "Checking authentication..." : "Loading experience..."}</div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium text-foreground">Experience not found</p>
          <Button asChild className="mt-4"><Link href="/admin">Go to Admin</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href={`/experience/${experience.id}`}><ArrowLeft className="w-4 h-4 mr-2" />Back to Experience</Link></Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm" disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? "Updating..." : "Update"}</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Edit Experience
          </h1>
          <p className="text-muted-foreground">Admin editor for modifying submission details.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Current Status (Admin)</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="needs_revision">Needs Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Tips for juniors..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto px-8">
              {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

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

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../../../components/company-selector"
import { BatchSelector } from "../../../../components/batch-selector"
import { ThemeToggle } from "../../../../components/theme-toggle"
import { Footer } from "../../../../components/footer"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Save, Plus, Trash2, FileText, CheckCircle, AlertTriangle
} from "lucide-react"

// Logic
import { 
  getExperienceById, updateExperience,
  getExperienceRounds, deleteExperienceRounds, saveExperienceRounds,
  getExperienceResources, deleteExperienceResources, saveExperienceResources
} from "../../../../lib/database"
import { companies } from "../../../../data/companies"
import Link from "next/link"
import NextImage from "next/image"
import DOMPurify from "dompurify"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null
  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

interface StudentEditPageProps {
  params: Promise<{ id: string }>
}

export default function StudentEditPage({ params }: StudentEditPageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  
  const [experience, setExperience] = useState<Experience | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")
  const [adminNote, setAdminNote] = useState("")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[400px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const foundExperience = await getExperienceById(id)
        if (!foundExperience) {
          router.push("/")
          return
        }

        // Only allow editing if status is needs_revision
        if (foundExperience.status !== "needs_revision") {
          setLoading(false)
          return
        }

        setExperience(foundExperience)
        
        // Basic Info
        setAuthor(foundExperience.author || "")
        setAuthorEmail(foundExperience.authorEmail || "")
        setSapId(foundExperience.sapId || "")
        setSelectedCompany(foundExperience.companyId || "")
        setSelectedBatch(foundExperience.batchId || "")
        setExperienceType(foundExperience.experienceType || "")
        setRole(foundExperience.role || "")
        setSelectionStatus(foundExperience.selectionStatus || "")
        setCtc(foundExperience.ctc ? String(foundExperience.ctc) : "")
        setOfferType(foundExperience.offerType || "")
        setDuration(foundExperience.duration || "")
        setDifficulty(foundExperience.difficulty || "")
        setTitle(foundExperience.title || "")
        setAdminNote(foundExperience.adminReviewNote || "")
        setTips(foundExperience.tips || "")
        setSelectedTopics(foundExperience.topicsCovered || [])

        // Set Editor content
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(foundExperience.content)
        }

        // Fetch and map Rounds
        const fetchedRounds = await getExperienceRounds(id)
        if (fetchedRounds && fetchedRounds.length > 0) {
          setRounds(fetchedRounds.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextRoundId(fetchedRounds.length + 1)
        }

        // Fetch and map Resources
        const fetchedResources = await getExperienceResources(id)
        if (fetchedResources && fetchedResources.length > 0) {
          setResources(fetchedResources.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextResourceId(fetchedResources.length + 1)
        }

      } catch (error) {
        console.error("Error loading experience details:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id, router, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !experience) return
    
    if (!author || !authorEmail || !selectedCompany || !selectedBatch || !role || !selectionStatus || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for the detailed experience.")
      return
    }

    setIsSaving(true)
    try {
      // 1. Update main experience - SET STATUS BACK TO PENDING
      await updateExperience({
        ...experience,
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        authorEmail,
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        status: "pending", 
        sapId: sapId || null,
        experienceType: (experienceType as "internship" | "placement") || null,
        difficulty: (difficulty as "easy" | "medium" | "hard") || null,
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Overwrite rounds (Delete old, insert new)
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      await deleteExperienceRounds(experience.id)
      if (validRounds.length > 0) {
        await saveExperienceRounds(experience.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Overwrite resources (Delete old, insert new)
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      await deleteExperienceResources(experience.id)
      if (validResources.length > 0) {
        await saveExperienceResources(experience.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      setIsSuccess(true)
      window.scrollTo(0, 0)
    } catch (error) {
      alert("Error submitting experience. Please try again.")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">Loading experience...</div>
      </div>
    )
  }

  if (experience && experience.status !== "needs_revision" && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-6 border-orange-200 dark:border-orange-900">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription className="mt-2 text-base">
              This submission is currently marked as <strong>{experience.status}</strong>. It can only be edited if an admin explicitly requests a revision.
            </CardDescription>
            <Button asChild className="mt-6"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center p-8 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800 dark:text-green-300">Successfully Resubmitted!</CardTitle>
            <CardDescription className="text-base mt-4">
              Thank you for updating your interview experience. It has been sent back to the admins for review. You can safely close this page.
            </CardDescription>
            <Button asChild className="mt-8"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white"><Save className="w-4 h-4 mr-2" />{isSaving ? "Submitting..." : "Resubmit to Admin"}</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Revise Your Experience
          </h1>
          <p className="text-muted-foreground">Please review the admin note below and make the necessary updates.</p>
        </div>

        {adminNote && (
          <div className="mb-8 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">
              <AlertTriangle className="w-5 h-5" /> Admin Review Note
            </h3>
            <p className="text-orange-700 dark:text-orange-300 whitespace-pre-wrap">{adminNote}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Email Address (For notifications) *</Label>
                  <Input id="authorEmail" type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Tips for juniors..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto px-8 bg-green-600 hover:bg-green-700 text-white">
              {isSaving ? "Submitting..." : <><Save className="w-4 h-4 mr-2" /> Resubmit to Admin</>}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../components/company-selector"
import { BatchSelector } from "../../components/batch-selector"
import { ThemeToggle } from "../../components/theme-toggle"
import { Footer } from "../../components/footer"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Send, Plus, Trash2, CheckCircle, FileText
} from "lucide-react"

// Logic
import { saveExperience, saveExperienceRounds, saveExperienceResources, getBatchByYear } from "../../lib/database"
import { companies } from "../../data/companies"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "dompurify"
import type { ExperienceRound, ExperienceResource } from "../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

const TEMPLATES = {
  placement: `<h2>My Placement Interview Experience</h2><p>Describe your overall interview journey here...</p><h3>Key Questions Asked</h3><ul><li>...</li></ul><h3>What I Learned</h3><ul><li>...</li></ul>`,
  internship: `<h2>My Internship Interview Experience</h2><p>Describe your overall interview journey here...</p><h3>Key Questions Asked</h3><ul><li>...</li></ul><h3>What I Learned</h3><ul><li>...</li></ul>`
}

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null
  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

export default function SubmitExperiencePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  useEffect(() => {
    async function loadDefaultBatch() {
      try {
        const defaultBatch = await getBatchByYear(2026)
        if (defaultBatch) setSelectedBatch(defaultBatch.id)
      } catch (error) {
        console.error("Error setting default batch:", error)
      }
    }
    loadDefaultBatch()
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: TEMPLATES.placement,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[300px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  // Update template when experience type changes
  useEffect(() => {
    if (editor && experienceType) {
      if (editor.getHTML() === TEMPLATES.placement || editor.getHTML() === TEMPLATES.internship || editor.getHTML() === "<p></p>") {
         editor.commands.setContent(TEMPLATES[experienceType])
      }
    }
  }, [experienceType, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!author || !authorEmail || !sapId || !selectedCompany || !selectedBatch || !experienceType || !role || !selectionStatus || !difficulty || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor?.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for your detailed experience.")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Save main experience
      const savedExp = await saveExperience({
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        authorEmail,
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        tags: [],
        status: "pending",
        sapId,
        experienceType: experienceType as "internship" | "placement",
        difficulty: difficulty as "easy" | "medium" | "hard",
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Save rounds if any
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      if (validRounds.length > 0) {
        await saveExperienceRounds(savedExp.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Save resources if any
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      if (validResources.length > 0) {
        await saveExperienceResources(savedExp.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      setIsSuccess(true)
      window.scrollTo(0, 0)
    } catch (error) {
      alert("Error submitting experience. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto px-4 w-full py-16 flex items-center justify-center">
          <Card className="w-full text-center p-8 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-800 dark:text-green-300">Experience Submitted!</CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for sharing your experience. It is currently pending admin review.
                Once approved, it will be visible on the public site to help your peers and juniors.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
              <Button asChild><Link href="/">Return to Home</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Share Your Experience
          </h1>
          <p className="text-muted-foreground">Help your juniors by sharing your interview process and insights.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" placeholder="John Doe" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Email Address (For notifications) *</Label>
                  <Input id="authorEmail" type="email" placeholder="john@example.com" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID *</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <Image src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type *</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" placeholder="Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty *</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" placeholder="My SDE Interview Experience at Google" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
              <CardDescription>Select all topics that were part of the interview process.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
              <CardDescription>Add details for each round you went through.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round, index) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
              <CardDescription>Share your complete journey, thoughts, and advice.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
              <CardDescription>Any specific advice for your juniors preparing for this company?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Focus heavily on Dynamic Programming. Practice mock interviews..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
              <CardDescription>Share links or names of resources that helped you prepare.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8">
              {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Experience</>}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { CompanyCard } from "../components/company-card"
import { companies } from "../data/companies"
import { getExperiences, getBatches, getBatchByYear } from "../lib/database"
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
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([])
  const [companiesWithExperiences, setCompaniesWithExperiences] = useState<Company[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedBatches, fetchedExperiences] = await Promise.all([getBatches(), getExperiences()])

        const activeBatches = fetchedBatches.filter((batch) => batch.isActive)
        setBatches(activeBatches)
        setAllExperiences(fetchedExperiences)

        const defaultBatch = (await getBatchByYear(2026)) || activeBatches[0]
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
  }, [selectedBatch, searchTerm, allExperiences, viewMode])

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

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../../../components/company-selector"
import { BatchSelector } from "../../../../components/batch-selector"
import { ThemeToggle } from "../../../../components/theme-toggle"
import { Footer } from "../../../../components/footer"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Save, Plus, Trash2, FileText, CheckCircle, AlertTriangle
} from "lucide-react"

// Logic
import { 
  getExperienceById, updateExperience,
  getExperienceRounds, deleteExperienceRounds, saveExperienceRounds,
  getExperienceResources, deleteExperienceResources, saveExperienceResources
} from "../../../../lib/database"
import { companies } from "../../../../data/companies"
import Link from "next/link"
import NextImage from "next/image"
import DOMPurify from "dompurify"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null
  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

interface StudentEditPageProps {
  params: Promise<{ id: string }>
}

export default function StudentEditPage({ params }: StudentEditPageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  
  const [experience, setExperience] = useState<Experience | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")
  const [adminNote, setAdminNote] = useState("")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[400px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const foundExperience = await getExperienceById(id)
        if (!foundExperience) {
          router.push("/")
          return
        }

        // Only allow editing if status is needs_revision
        if (foundExperience.status !== "needs_revision") {
          setLoading(false)
          return
        }

        setExperience(foundExperience)
        
        // Basic Info
        setAuthor(foundExperience.author || "")
        setAuthorEmail(foundExperience.authorEmail || "")
        setSapId(foundExperience.sapId || "")
        setSelectedCompany(foundExperience.companyId || "")
        setSelectedBatch(foundExperience.batchId || "")
        setExperienceType(foundExperience.experienceType || "")
        setRole(foundExperience.role || "")
        setSelectionStatus(foundExperience.selectionStatus || "")
        setCtc(foundExperience.ctc ? String(foundExperience.ctc) : "")
        setOfferType(foundExperience.offerType || "")
        setDuration(foundExperience.duration || "")
        setDifficulty(foundExperience.difficulty || "")
        setTitle(foundExperience.title || "")
        setAdminNote(foundExperience.adminReviewNote || "")
        setTips(foundExperience.tips || "")
        setSelectedTopics(foundExperience.topicsCovered || [])

        // Set Editor content
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(foundExperience.content)
        }

        // Fetch and map Rounds
        const fetchedRounds = await getExperienceRounds(id)
        if (fetchedRounds && fetchedRounds.length > 0) {
          setRounds(fetchedRounds.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextRoundId(fetchedRounds.length + 1)
        }

        // Fetch and map Resources
        const fetchedResources = await getExperienceResources(id)
        if (fetchedResources && fetchedResources.length > 0) {
          setResources(fetchedResources.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextResourceId(fetchedResources.length + 1)
        }

      } catch (error) {
        console.error("Error loading experience details:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id, router, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !experience) return
    
    if (!author || !authorEmail || !selectedCompany || !selectedBatch || !role || !selectionStatus || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for the detailed experience.")
      return
    }

    setIsSaving(true)
    try {
      // 1. Update main experience - SET STATUS BACK TO PENDING
      await updateExperience({
        ...experience,
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        authorEmail,
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        status: "pending", 
        sapId: sapId || null,
        experienceType: (experienceType as "internship" | "placement") || null,
        difficulty: (difficulty as "easy" | "medium" | "hard") || null,
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Overwrite rounds (Delete old, insert new)
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      await deleteExperienceRounds(experience.id)
      if (validRounds.length > 0) {
        await saveExperienceRounds(experience.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Overwrite resources (Delete old, insert new)
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      await deleteExperienceResources(experience.id)
      if (validResources.length > 0) {
        await saveExperienceResources(experience.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      setIsSuccess(true)
      window.scrollTo(0, 0)
    } catch (error) {
      alert("Error submitting experience. Please try again.")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">Loading experience...</div>
      </div>
    )
  }

  if (experience && experience.status !== "needs_revision" && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-6 border-orange-200 dark:border-orange-900">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription className="mt-2 text-base">
              This submission is currently marked as <strong>{experience.status}</strong>. It can only be edited if an admin explicitly requests a revision.
            </CardDescription>
            <Button asChild className="mt-6"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center p-8 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800 dark:text-green-300">Successfully Resubmitted!</CardTitle>
            <CardDescription className="text-base mt-4">
              Thank you for updating your interview experience. It has been sent back to the admins for review. You can safely close this page.
            </CardDescription>
            <Button asChild className="mt-8"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white"><Save className="w-4 h-4 mr-2" />{isSaving ? "Submitting..." : "Resubmit to Admin"}</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Revise Your Experience
          </h1>
          <p className="text-muted-foreground">Please review the admin note below and make the necessary updates.</p>
        </div>

        {adminNote && (
          <div className="mb-8 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">
              <AlertTriangle className="w-5 h-5" /> Admin Review Note
            </h3>
            <p className="text-orange-700 dark:text-orange-300 whitespace-pre-wrap">{adminNote}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Email Address (For notifications) *</Label>
                  <Input id="authorEmail" type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Tips for juniors..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto px-8 bg-green-600 hover:bg-green-700 text-white">
              {isSaving ? "Submitting..." : <><Save className="w-4 h-4 mr-2" /> Resubmit to Admin</>}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}

"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../components/company-selector"
import { BatchSelector } from "../../components/batch-selector"
import { ThemeToggle } from "../../components/theme-toggle"
import { Footer } from "../../components/footer"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Send, Plus, Trash2, CheckCircle, FileText
} from "lucide-react"

// Logic
import { saveExperience, saveExperienceRounds, saveExperienceResources, getBatchByYear } from "../../lib/database"
import { companies } from "../../data/companies"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "dompurify"
import type { ExperienceRound, ExperienceResource } from "../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

const TEMPLATES = {
  placement: `<h2>My Placement Interview Experience</h2><p>Describe your overall interview journey here...</p><h3>Key Questions Asked</h3><ul><li>...</li></ul><h3>What I Learned</h3><ul><li>...</li></ul>`,
  internship: `<h2>My Internship Interview Experience</h2><p>Describe your overall interview journey here...</p><h3>Key Questions Asked</h3><ul><li>...</li></ul><h3>What I Learned</h3><ul><li>...</li></ul>`
}

const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null
  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

export default function SubmitExperiencePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  useEffect(() => {
    async function loadDefaultBatch() {
      try {
        const defaultBatch = await getBatchByYear(2026)
        if (defaultBatch) setSelectedBatch(defaultBatch.id)
      } catch (error) {
        console.error("Error setting default batch:", error)
      }
    }
    loadDefaultBatch()
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: TEMPLATES.placement,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[300px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  // Update template when experience type changes
  useEffect(() => {
    if (editor && experienceType) {
      if (editor.getHTML() === TEMPLATES.placement || editor.getHTML() === TEMPLATES.internship || editor.getHTML() === "<p></p>") {
         editor.commands.setContent(TEMPLATES[experienceType])
      }
    }
  }, [experienceType, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!author || !authorEmail || !sapId || !selectedCompany || !selectedBatch || !experienceType || !role || !selectionStatus || !difficulty || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor?.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for your detailed experience.")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Save main experience
      const savedExp = await saveExperience({
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        authorEmail,
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        tags: [],
        status: "pending",
        sapId,
        experienceType: experienceType as "internship" | "placement",
        difficulty: difficulty as "easy" | "medium" | "hard",
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Save rounds if any
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      if (validRounds.length > 0) {
        await saveExperienceRounds(savedExp.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Save resources if any
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      if (validResources.length > 0) {
        await saveExperienceResources(savedExp.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      setIsSuccess(true)
      window.scrollTo(0, 0)
    } catch (error) {
      alert("Error submitting experience. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto px-4 w-full py-16 flex items-center justify-center">
          <Card className="w-full text-center p-8 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-800 dark:text-green-300">Experience Submitted!</CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for sharing your experience. It is currently pending admin review.
                Once approved, it will be visible on the public site to help your peers and juniors.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
              <Button asChild><Link href="/">Return to Home</Link></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Share Your Experience
          </h1>
          <p className="text-muted-foreground">Help your juniors by sharing your interview process and insights.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" placeholder="John Doe" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Email Address (For notifications) *</Label>
                  <Input id="authorEmail" type="email" placeholder="john@example.com" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID *</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <Image src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type *</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" placeholder="Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty *</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" placeholder="My SDE Interview Experience at Google" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
              <CardDescription>Select all topics that were part of the interview process.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
              <CardDescription>Add details for each round you went through.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round, index) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
              <CardDescription>Share your complete journey, thoughts, and advice.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
              <CardDescription>Any specific advice for your juniors preparing for this company?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Focus heavily on Dynamic Programming. Practice mock interviews..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
              <CardDescription>Share links or names of resources that helped you prepare.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-8">
              {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4 mr-2" /> Submit Experience</>}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
