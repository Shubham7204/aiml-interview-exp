"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { aiml25Placements } from "../../data/aiml25-placements"
import { Search, LayoutGrid, TableIcon, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Footer } from "../../components/footer"

export default function AIML25Page() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")

  const filteredPlacements = useMemo(() => {
    return aiml25Placements.filter(
      (placement) =>
        placement.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        placement.Company.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [searchTerm])

  const getCTCBadgeColor = (ctc: number) => {
    if (ctc >= 15) return "bg-green-100 text-green-800 border-green-200"
    if (ctc >= 10) return "bg-blue-100 text-blue-800 border-blue-200"
    if (ctc >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold">AIML 25 Placement Experiences</h1>
                <p className="text-sm text-gray-600">Department of AIML, DJSCE</p>
              </div>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to AIML 26
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by student name or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlacements.map((placement) => (
              <Card key={placement.SrNo} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{placement.StudentName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{placement.Company}</p>
                    </div>
                    <Badge className={getCTCBadgeColor(placement.CTC)}>₹{placement.CTC}L</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <a
                    href={placement.PlacementExperienceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Experience
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>CTC (₹L)</TableHead>
                    <TableHead>Experience</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlacements.map((placement) => (
                    <TableRow key={placement.SrNo}>
                      <TableCell className="font-medium">{placement.SrNo}</TableCell>
                      <TableCell>{placement.StudentName}</TableCell>
                      <TableCell>{placement.Company}</TableCell>
                      <TableCell>
                        <Badge className={getCTCBadgeColor(placement.CTC)}>₹{placement.CTC}L</Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={placement.PlacementExperienceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {filteredPlacements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No placements found matching your search.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
