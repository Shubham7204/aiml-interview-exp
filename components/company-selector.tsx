"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCompanies } from "../lib/database"
import type { Company } from "../types/company"
import Image from "next/image"
import { useEffect, useState } from "react"

interface CompanySelectorProps {
  onCompanySelect: (companyId: string) => void
  selectedCompany?: string
}

export function CompanySelector({ onCompanySelect, selectedCompany }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCompanies() {
      try {
        setCompanies(await getCompanies())
      } catch (error) {
        console.error("Error loading companies:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
  }, [])

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Loading companies..." />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={selectedCompany} onValueChange={onCompanySelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center gap-3">
              <Image
                src={company.logo || "/placeholder.svg"}
                alt={`${company.name} logo`}
                width={24}
                height={24}
                className="rounded"
              />
              <span>{company.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
