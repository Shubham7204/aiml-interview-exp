import { supabase } from "./supabase"
import type { Experience, Batch, ExperienceRound, ExperienceResource } from "../types/company"

// ============================================
// Helper: Map DB row to Experience object
// ============================================
function mapExperience(item: any): Experience {
  return {
    id: item.id,
    batchId: item.batch_id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    authorEmail: item.author_email,
    content: item.content,
    selectionStatus: item.selection_status,
    ctc: item.ctc,
    offerType: item.offer_type,
    tags: item.tags || [],
    createdAt: item.created_at,
    // Moderation fields
    status: item.status || "approved",
    adminReviewNote: item.admin_review_note,
    // New submission fields
    sapId: item.sap_id,
    experienceType: item.experience_type,
    difficulty: item.difficulty,
    topicsCovered: item.topics_covered || [],
    tips: item.tips,
    updatedAt: item.updated_at,
    // Batch relation
    batch: item.batches
      ? {
          id: item.batches.id,
          year: item.batches.year,
          name: item.batches.name,
          description: item.batches.description,
          isActive: item.batches.is_active,
          createdAt: item.batches.created_at,
          updatedAt: item.batches.updated_at,
        }
      : undefined,
  }
}

const EXPERIENCE_SELECT = `
  *,
  batches (
    id,
    year,
    name,
    description,
    is_active,
    created_at,
    updated_at
  )
`

// ============================================
// Batch management functions
// ============================================
export async function getBatches(): Promise<Batch[]> {
  const { data, error } = await supabase.from("batches").select("*").order("year", { ascending: false })

  if (error) {
    console.error("Error fetching batches:", error)
    throw new Error("Failed to fetch batches")
  }

  return data.map((item) => ({
    id: item.id,
    year: item.year,
    name: item.name,
    description: item.description,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }))
}

export async function getBatchById(id: string): Promise<Batch | null> {
  const { data, error } = await supabase.from("batches").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching batch:", error)
    throw new Error("Failed to fetch batch")
  }

  return {
    id: data.id,
    year: data.year,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function getBatchByYear(year: number): Promise<Batch | null> {
  const { data, error } = await supabase.from("batches").select("*").eq("year", year).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching batch by year:", error)
    throw new Error("Failed to fetch batch")
  }

  return {
    id: data.id,
    year: data.year,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function getActiveBatch(): Promise<Batch | null> {
  const { data, error } = await supabase
    .from("batches")
    .select("*")
    .eq("is_active", true)
    .order("year", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching active batch:", error)
    throw new Error("Failed to fetch active batch")
  }

  return {
    id: data.id,
    year: data.year,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createBatch(batch: Omit<Batch, "id" | "createdAt" | "updatedAt">): Promise<Batch> {
  const { data, error } = await supabase
    .from("batches")
    .insert([
      {
        year: batch.year,
        name: batch.name,
        description: batch.description,
        is_active: batch.isActive,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating batch:", error)
    throw new Error("Failed to create batch")
  }

  return {
    id: data.id,
    year: data.year,
    name: data.name,
    description: data.description,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ============================================
// Experience CRUD functions
// ============================================

export async function saveExperience(experience: Omit<Experience, "id" | "createdAt">): Promise<Experience> {
  const { data, error } = await supabase
    .from("experiences")
    .insert([
      {
        batch_id: experience.batchId,
        company_id: experience.companyId,
        title: experience.title,
        role: experience.role,
        duration: experience.duration,
        author: experience.author,
        author_email: experience.authorEmail || null,
        content: experience.content,
        selection_status: experience.selectionStatus,
        ctc: experience.ctc,
        offer_type: experience.offerType,
        tags: experience.tags || [],
        status: experience.status || "pending",
        admin_review_note: experience.adminReviewNote || null,
        sap_id: experience.sapId || null,
        experience_type: experience.experienceType || null,
        difficulty: experience.difficulty || null,
        topics_covered: experience.topicsCovered || [],
        tips: experience.tips || null,
      },
    ])
    .select(EXPERIENCE_SELECT)
    .single()

  if (error) {
    console.error("Error saving experience:", error)
    throw new Error("Failed to save experience")
  }

  return mapExperience(data)
}

export async function updateExperience(experience: Experience): Promise<Experience> {
  const { data, error } = await supabase
    .from("experiences")
    .update({
      batch_id: experience.batchId,
      company_id: experience.companyId,
      title: experience.title,
      role: experience.role,
      duration: experience.duration,
      author: experience.author,
      author_email: experience.authorEmail || null,
      content: experience.content,
      selection_status: experience.selectionStatus,
      ctc: experience.ctc,
      offer_type: experience.offerType,
      tags: experience.tags || [],
      status: experience.status,
      admin_review_note: experience.adminReviewNote || null,
      sap_id: experience.sapId || null,
      experience_type: experience.experienceType || null,
      difficulty: experience.difficulty || null,
      topics_covered: experience.topicsCovered || [],
      tips: experience.tips || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", experience.id)
    .select(EXPERIENCE_SELECT)
    .single()

  if (error) {
    console.error("Error updating experience:", error)
    throw new Error("Failed to update experience")
  }

  return mapExperience(data)
}

export async function deleteExperience(experienceId: string): Promise<void> {
  const { error } = await supabase.from("experiences").delete().eq("id", experienceId)

  if (error) {
    console.error("Error deleting experience:", error)
    throw new Error("Failed to delete experience")
  }
}

// ============================================
// Public-facing queries (approved only)
// ============================================

export async function getExperiences(): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching experiences:", error)
    throw new Error("Failed to fetch experiences")
  }

  return data.map(mapExperience)
}

export async function getExperiencesByBatch(batchId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("batch_id", batchId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching batch experiences:", error)
    throw new Error("Failed to fetch batch experiences")
  }

  return data.map(mapExperience)
}

export async function getExperiencesByCompany(companyId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company experiences:", error)
    throw new Error("Failed to fetch company experiences")
  }

  return data.map(mapExperience)
}

export async function getExperiencesByBatchAndCompany(batchId: string, companyId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("batch_id", batchId)
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company experiences:", error)
    throw new Error("Failed to fetch company experiences")
  }

  return data.map(mapExperience)
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching experience:", error)
    throw new Error("Failed to fetch experience")
  }

  return mapExperience(data)
}

// ============================================
// Admin / Moderation queries (all statuses)
// ============================================

export async function getAllExperiencesForAdmin(): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all experiences:", error)
    throw new Error("Failed to fetch all experiences")
  }

  return data.map(mapExperience)
}

export async function getExperiencesByStatus(status: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_SELECT)
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching experiences by status:", error)
    throw new Error("Failed to fetch experiences by status")
  }

  return data.map(mapExperience)
}

export async function getPendingExperiences(): Promise<Experience[]> {
  return getExperiencesByStatus("pending")
}

export async function updateExperienceStatus(
  id: string,
  status: "approved" | "rejected" | "needs_revision",
  reviewNote?: string
): Promise<Experience> {
  const { data, error } = await supabase
    .from("experiences")
    .update({
      status,
      admin_review_note: reviewNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(EXPERIENCE_SELECT)
    .single()

  if (error) {
    console.error("Error updating experience status:", error)
    throw new Error("Failed to update experience status")
  }

  return mapExperience(data)
}

// ============================================
// Experience Rounds
// ============================================

export async function saveExperienceRounds(
  experienceId: string,
  rounds: Omit<ExperienceRound, "id">[]
): Promise<ExperienceRound[]> {
  if (rounds.length === 0) return []

  const insertData = rounds.map((round) => ({
    experience_id: experienceId,
    round_number: round.roundNumber,
    round_name: round.roundName,
    round_type: round.roundType,
    duration: round.duration || null,
    topics: round.topics || null,
    description: round.description || null,
  }))

  const { data, error } = await supabase
    .from("experience_rounds")
    .insert(insertData)
    .select()

  if (error) {
    console.error("Error saving rounds:", error)
    throw new Error("Failed to save experience rounds")
  }

  return data.map((item: any) => ({
    id: item.id,
    experienceId: item.experience_id,
    roundNumber: item.round_number,
    roundName: item.round_name,
    roundType: item.round_type,
    duration: item.duration,
    topics: item.topics,
    description: item.description,
  }))
}

export async function getExperienceRounds(experienceId: string): Promise<ExperienceRound[]> {
  const { data, error } = await supabase
    .from("experience_rounds")
    .select("*")
    .eq("experience_id", experienceId)
    .order("round_number", { ascending: true })

  if (error) {
    console.error("Error fetching rounds:", error)
    throw new Error("Failed to fetch experience rounds")
  }

  return data.map((item: any) => ({
    id: item.id,
    experienceId: item.experience_id,
    roundNumber: item.round_number,
    roundName: item.round_name,
    roundType: item.round_type,
    duration: item.duration,
    topics: item.topics,
    description: item.description,
  }))
}

export async function deleteExperienceRounds(experienceId: string): Promise<void> {
  const { error } = await supabase
    .from("experience_rounds")
    .delete()
    .eq("experience_id", experienceId)

  if (error) {
    console.error("Error deleting rounds:", error)
    throw new Error("Failed to delete experience rounds")
  }
}

// ============================================
// Experience Resources
// ============================================

export async function saveExperienceResources(
  experienceId: string,
  resources: Omit<ExperienceResource, "id">[]
): Promise<ExperienceResource[]> {
  if (resources.length === 0) return []

  const insertData = resources.map((resource) => ({
    experience_id: experienceId,
    resource_name: resource.resourceName,
    resource_link: resource.resourceLink || null,
  }))

  const { data, error } = await supabase
    .from("experience_resources")
    .insert(insertData)
    .select()

  if (error) {
    console.error("Error saving resources:", error)
    throw new Error("Failed to save experience resources")
  }

  return data.map((item: any) => ({
    id: item.id,
    experienceId: item.experience_id,
    resourceName: item.resource_name,
    resourceLink: item.resource_link,
  }))
}

export async function getExperienceResources(experienceId: string): Promise<ExperienceResource[]> {
  const { data, error } = await supabase
    .from("experience_resources")
    .select("*")
    .eq("experience_id", experienceId)

  if (error) {
    console.error("Error fetching resources:", error)
    throw new Error("Failed to fetch experience resources")
  }

  return data.map((item: any) => ({
    id: item.id,
    experienceId: item.experience_id,
    resourceName: item.resource_name,
    resourceLink: item.resource_link,
  }))
}

export async function deleteExperienceResources(experienceId: string): Promise<void> {
  const { error } = await supabase
    .from("experience_resources")
    .delete()
    .eq("experience_id", experienceId)

  if (error) {
    console.error("Error deleting resources:", error)
    throw new Error("Failed to delete experience resources")
  }
}

// ============================================
// Utility
// ============================================

export function generateId(): string {
  return crypto.randomUUID()
}
