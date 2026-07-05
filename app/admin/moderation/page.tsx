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
  onStatusUpdate: (id: string, status: "approved" | "rejected" | "needs_revision", note?: string) => Promise<void>
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
