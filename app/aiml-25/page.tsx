"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink, Menu, X } from "lucide-react"
import Link from "next/link"
import { Footer } from "../../components/footer"
import { ThemeToggle } from "../../components/theme-toggle"
import { aiml25Placements } from "../../data/aiml25-placements"

export default function AIML25Page() {
  const [searchTerm, setSearchTerm] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const filteredPlacements = aiml25Placements.filter(
    (placement) =>
      placement.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.Company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCTCBadgeColor = (ctc: number) => {
    if (ctc >= 20) return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
    if (ctc >= 15) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
    if (ctc >= 10) return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700"
    if (ctc >= 7) return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
    return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-50">
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
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">AIML 25 Placement Experiences</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Department of AIML, DJSCE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                AIML 26 Experiences
              </Link>
              <ThemeToggle />
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
            <div className="md:hidden border-t border-border py-3">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-3 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  AIML 26 Experiences
                </Link>
                <div className="pr-3">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Page Title */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">AIML 25 Placement Experiences</h2>
            <p className="text-muted-foreground text-sm sm:text-base">Real placement experiences from AIML 25 batch students</p>
          </div>

          {/* Search Controls */}
          <div className="flex justify-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by student name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredPlacements.length} of {aiml25Placements.length} experiences
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPlacements.map((placement) => (
              <Card key={placement.SrNo} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-semibold text-foreground leading-tight">
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
                      <p className="text-sm text-muted-foreground mb-1">Company</p>
                      <p className="font-medium text-foreground">{placement.Company}</p>
                    </div>
                    <a
                      href={placement.PlacementExperienceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read Experience
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlacements.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No experiences found matching your search.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
