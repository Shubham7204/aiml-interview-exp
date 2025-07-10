export interface Company {
  id: string
  name: string
  logo: string
  description: string
  website?: string
  industry: string
  experienceCount: number
}

export interface Experience {
  id: string
  companyId: string
  title: string
  role: string
  duration: string
  content: string
  author: string
  createdAt: string
  tags: string[]
}
