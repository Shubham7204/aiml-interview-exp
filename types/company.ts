export interface Company {
  id: string
  name: string
  logo: string
  description: string
  website?: string
  industry: string
  experienceCount: number
  createdAt?: string
  updatedAt?: string
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
  authorEmail?: string | null
  createdAt: string
  updatedAt?: string | null
  tags: string[]
  selectionStatus: "selected" | "not-selected"
  ctc?: number | null
  offerType?: string | null
  batch?: Batch
  // New fields
  status: "pending" | "approved" | "rejected" | "needs_revision"
  sapId?: string | null
  experienceType?: "internship" | "placement" | null
  difficulty?: "easy" | "medium" | "hard" | null
  topicsCovered?: string[]
  tips?: string | null
  adminReviewNote?: string | null
}

export interface ExperienceRound {
  id: string
  experienceId?: string
  roundNumber: number
  roundName: string
  roundType: string
  duration?: string | null
  topics?: string | null
  description?: string | null
}

export interface ExperienceResource {
  id: string
  experienceId?: string
  resourceName: string
  resourceLink?: string | null
}
