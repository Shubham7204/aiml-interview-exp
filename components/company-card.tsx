import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Company } from "../types/company"
import Image from "next/image"
import Link from "next/link"
import { Building2, Users, ExternalLink } from "lucide-react"

interface CompanyCardProps {
  company: Company
  batchId?: string
}

export function CompanyCard({ company, batchId }: CompanyCardProps) {
  const href = batchId ? `/batch/${batchId}/company/${company.id}` : `/company/${company.id}`

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-sm border">
            <Image
              src={company.logo || "/placeholder.svg"}
              alt={`${company.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{company.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{company.description}</p>
            <Badge variant="secondary" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              {company.industry}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{company.experienceCount} Interview Experiences</span>
          </div>
          <div className="flex gap-2">
            {company.website && (
              <Button variant="ghost" size="sm" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href={href}>View Experiences</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
