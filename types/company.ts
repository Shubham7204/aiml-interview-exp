export interface Company {
  id: string
  name: string
  logo: string
  description: string
  website?: string
  industry: string
  experienceCount: number
}

export interface Batch {
  id: string
  year: number
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Experience {
  id: string
  batchId: string
  companyId: string
  title: string
  role: string
  duration: string
  content: string
  author: string
  createdAt: string
  tags: string[]
  selectionStatus: "selected" | "not-selected"
  ctc?: number | null
  offerType?: string | null
  batch?: Batch
  // Moderation fields
  status: "pending" | "approved" | "rejected" | "needs_revision"
  adminReviewNote?: string | null
  // New submission fields
  sapId?: string | null
  experienceType?: "internship" | "placement" | null
  difficulty?: "easy" | "medium" | "hard" | null
  topicsCovered?: string[]
  tips?: string | null
  updatedAt?: string
  // Related data
  rounds?: ExperienceRound[]
  resources?: ExperienceResource[]
  authorEmail?: string | null
}

export interface ExperienceRound {
  id: string
  experienceId?: string
  roundNumber: number
  roundName: string
  roundType: "online_assessment" | "technical" | "hr" | "group_discussion" | "case_study" | "coding" | "other"
  duration?: string
  topics?: string
  description?: string
}

export interface ExperienceResource {
  id: string
  experienceId?: string
  resourceName: string
  resourceLink?: string
}
