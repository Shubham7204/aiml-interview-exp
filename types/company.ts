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
  batch?: Batch
}
