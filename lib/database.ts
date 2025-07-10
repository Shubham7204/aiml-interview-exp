import { supabase } from "./supabase"
import type { Experience } from "../types/company"

export async function saveExperience(experience: Omit<Experience, "id" | "createdAt">): Promise<Experience> {
  const { data, error } = await supabase
    .from("experiences")
    .insert([
      {
        company_id: experience.companyId,
        title: experience.title,
        role: experience.role,
        duration: experience.duration,
        author: experience.author,
        content: experience.content,
        tags: experience.tags || [],
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error saving experience:", error)
    throw new Error("Failed to save experience")
  }

  return {
    id: data.id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
  }
}

export async function updateExperience(experience: Experience): Promise<Experience> {
  const { data, error } = await supabase
    .from("experiences")
    .update({
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
    .select()
    .single()

  if (error) {
    console.error("Error updating experience:", error)
    throw new Error("Failed to update experience")
  }

  return {
    id: data.id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
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
  const { data, error } = await supabase.from("experiences").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching experiences:", error)
    throw new Error("Failed to fetch experiences")
  }

  return data.map((item) => ({
    id: item.id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
  }))
}

export async function getExperienceById(id: string): Promise<Experience | null> {
  const { data, error } = await supabase.from("experiences").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null
    }
    console.error("Error fetching experience:", error)
    throw new Error("Failed to fetch experience")
  }

  return {
    id: data.id,
    companyId: data.company_id,
    title: data.title,
    role: data.role,
    duration: data.duration,
    author: data.author,
    content: data.content,
    tags: data.tags,
    createdAt: data.created_at,
  }
}

export async function getExperiencesByCompany(companyId: string): Promise<Experience[]> {
  const { data, error } = await supabase
    .from("experiences")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company experiences:", error)
    throw new Error("Failed to fetch company experiences")
  }

  return data.map((item) => ({
    id: item.id,
    companyId: item.company_id,
    title: item.title,
    role: item.role,
    duration: item.duration,
    author: item.author,
    content: item.content,
    tags: item.tags,
    createdAt: item.created_at,
  }))
}

export function generateId(): string {
  return crypto.randomUUID()
}
