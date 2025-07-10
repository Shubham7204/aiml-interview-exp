import { supabase } from "./supabase"
import type { Experience, Batch } from "../types/company"

// Batch management functions
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

// Updated experience functions
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
        content: experience.content,
        tags: experience.tags || [],
      },
    ])
    .select(`
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
    `)
    .single()

  if (error) {
    console.error("Error saving experience:", error)
    throw new Error("Failed to save experience")
  }

  return {
    id: data.id,
    batchId: data.batch_id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
    batch: data.batches
      ? {
          id: data.batches.id,
          year: data.batches.year,
          name: data.batches.name,
          description: data.batches.description,
          isActive: data.batches.is_active,
          createdAt: data.batches.created_at,
          updatedAt: data.batches.updated_at,
        }
      : undefined,
  }
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
      content: experience.content,
      tags: experience.tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", experience.id)
    .select(`
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
    `)
    .single()

  if (error) {
    console.error("Error updating experience:", error)
    throw new Error("Failed to update experience")
  }

  return {
    id: data.id,
    batchId: data.batch_id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
    batch: data.batches
      ? {
          id: data.batches.id,
          year: data.batches.year,
          name: data.batches.name,
          description: data.batches.description,
          isActive: data.batches.is_active,
          createdAt: data.batches.created_at,
          updatedAt: data.batches.updated_at,
        }
      : undefined,
  }
}

export async function deleteExperience(experienceId: string): Promise<void> {
  const { error } = await supabase.from("experiences").delete().eq("id", experienceId)

  if (error) {
    console.error("Error deleting experience:", error)
    throw new Error("Failed to delete experience")
  }
}

export async function getExperiences(): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
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
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching experiences:", error)
    throw new Error("Failed to fetch experiences")
  }

  return data.map((item) => ({
    id: item.id,
    batchId: item.batch_id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
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
  }))
}

export async function getExperiencesByBatch(batchId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
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
    `)
    .eq("batch_id", batchId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching batch experiences:", error)
    throw new Error("Failed to fetch batch experiences")
  }

  return data.map((item) => ({
    id: item.id,
    batchId: item.batch_id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
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
  }))
}

// Backward compatibility function - gets experiences for all batches by company
export async function getExperiencesByCompany(companyId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
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
    `)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company experiences:", error)
    throw new Error("Failed to fetch company experiences")
  }

  return data.map((item) => ({
    id: item.id,
    batchId: item.batch_id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
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
  }))
}

export async function getExperiencesByBatchAndCompany(batchId: string, companyId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
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
    `)
    .eq("batch_id", batchId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company experiences:", error)
    throw new Error("Failed to fetch company experiences")
  }

  return data.map((item) => ({
    id: item.id,
    batchId: item.batch_id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
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
  }))
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const { data, error } = await supabase
    .from("experiences")
    .select(`
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
    `)
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching experience:", error)
    throw new Error("Failed to fetch experience")
  }

  return {
    id: data.id,
    batchId: data.batch_id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
    batch: data.batches
      ? {
          id: data.batches.id,
          year: data.batches.year,
          name: data.batches.name,
          description: data.batches.description,
          isActive: data.batches.is_active,
          createdAt: data.batches.created_at,
          updatedAt: data.batches.updated_at,
        }
      : undefined,
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}
