import type { Experience } from "../types/company"

const STORAGE_KEY = "aiml-placement-experiences"

export function saveExperience(experience: Experience): void {
  const experiences = getExperiences()
  experiences.push(experience)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences))
}

export function updateExperience(updatedExperience: Experience): void {
  const experiences = getExperiences()
  const index = experiences.findIndex((exp) => exp.id === updatedExperience.id)
  if (index !== -1) {
    experiences[index] = updatedExperience
    localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences))
  }
}

export function deleteExperience(experienceId: string): void {
  const experiences = getExperiences()
  const filteredExperiences = experiences.filter((exp) => exp.id !== experienceId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredExperiences))
}

export function getExperiences(): Experience[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function getExperienceById(id: string): Experience | null {
  const experiences = getExperiences()
  return experiences.find((exp) => exp.id === id) || null
}

export function getExperiencesByCompany(companyId: string): Experience[] {
  return getExperiences().filter((exp) => exp.companyId === companyId)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
