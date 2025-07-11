import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Company, Experience } from "../types/company"
import Image from "next/image"
import Link from "next/link"
import { Building2, Users, ExternalLink, IndianRupee } from "lucide-react"

interface CompanyCardProps {
  company: Company
  batchId?: string
  experiences: Experience[]
}

export function CompanyCard({ company, batchId, experiences }: CompanyCardProps) {
  const href = batchId ? `/batch/${batchId}/company/${company.id}` : `/company/${company.id}`

  const companyExperiences = experiences.filter(
    (exp) => exp.companyId === company.id && exp.batchId === batchId && exp.ctc,
  )

  const averageCtc =
    companyExperiences.length > 0
      ? Math.round((companyExperiences.reduce((acc, exp) => acc + (exp.ctc || 0), 0) / companyExperiences.length) * 10) / 10
      : null

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-background rounded-lg p-2 shadow-sm border">
            <Image
              src={company.logo || "/placeholder.svg"}
              alt={`${company.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1 text-foreground">{company.name}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{company.description}</p>
            <Badge variant="secondary" className="text-xs">
              <Building2 className="w-3 h-3 mr-1" />
              {company.industry}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow">
        {/* Content can go here if needed in the future */}
      </CardContent>
      <CardFooter className="flex items-end justify-between pt-4 mt-auto">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground flex items-center">
            <Users className="w-4 h-4 mr-2" /> {company.experienceCount} Experience{company.experienceCount === 1 ? "" : "s"}
          </p>
          {averageCtc && (
            <p className="text-sm text-muted-foreground flex items-center">
              <IndianRupee className="w-4 h-4 mr-2" /> Avg. CTC: {averageCtc % 1 === 0 ? averageCtc.toFixed(0) : averageCtc.toFixed(1)} LPA
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {company.website && (
            <Button variant="outline" size="icon" asChild>
              <a href={company.website} target="_blank" rel="noopener noreferrer" aria-label={`External link to ${company.name}`}>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button asChild>
            <Link href={href}>View Experiences</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
