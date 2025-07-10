"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { companies } from "../data/companies"
import Image from "next/image"

interface CompanySelectorProps {
  onCompanySelect: (companyId: string) => void
  selectedCompany?: string
}

export function CompanySelector({ onCompanySelect, selectedCompany }: CompanySelectorProps) {
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
