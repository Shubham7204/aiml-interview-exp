"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Grid, List, ExternalLink, Menu, X } from "lucide-react"
import Link from "next/link"
import { Footer } from "../../components/footer"
import { aiml25Placements } from "../../data/aiml25-placements"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AIML25Page() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filteredPlacements = aiml25Placements.filter(
    (placement) =>
      placement.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.Company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCTCBadgeColor = (ctc: number) => {
    if (ctc >= 20) return "bg-purple-100 text-purple-800 border-purple-200"
    if (ctc >= 15) return "bg-red-100 text-red-800 border-red-200"
    if (ctc >= 10) return "bg-orange-100 text-orange-800 border-orange-200"
    if (ctc >= 7) return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src="/djsce-logo.png"
                alt="DJSCE Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">AIML 25 Placement Experiences</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">Department of AIML, DJSCE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
              >
                AIML 26 Experiences
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3">
              <Link
                href="/"
                className="block text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                AIML 26 Experiences
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Page Title */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AIML 25 Placement Experiences</h2>
            <p className="text-gray-600 text-sm sm:text-base">Real placement experiences from AIML 25 batch students</p>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="flex-1 sm:flex-none"
              >
                <Grid className="w-4 h-4 mr-2" />
                Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="flex-1 sm:flex-none"
              >
                <List className="w-4 h-4 mr-2" />
                Table
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredPlacements.length} of {aiml25Placements.length} experiences
          </div>

          {/* Content */}
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredPlacements.map((placement) => (
                <Card key={placement.SrNo} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                        {placement.StudentName}
                      </CardTitle>
                      <Badge className={`${getCTCBadgeColor(placement.CTC)} font-semibold flex-shrink-0`}>
                        ₹{placement.CTC}L
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Company</p>
                        <p className="font-medium text-gray-900">{placement.Company}</p>
                      </div>
                      <a
                        href={placement.PlacementExperienceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Read Experience
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Student Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">CTC (₹L)</TableHead>
                      <TableHead className="w-[120px]">Experience</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlacements.map((placement) => (
                      <TableRow key={placement.SrNo}>
                        <TableCell className="font-medium">{placement.StudentName}</TableCell>
                        <TableCell>{placement.Company}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={`${getCTCBadgeColor(placement.CTC)} font-semibold`}>
                            ₹{placement.CTC}L
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={placement.PlacementExperienceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {filteredPlacements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No experiences found matching your search.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
