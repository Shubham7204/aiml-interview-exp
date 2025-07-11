"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanySelector } from "../../components/company-selector"
import { companies } from "../../data/companies"
import { saveExperience, getBatchByYear } from "../../lib/database"
import { isAuthenticated } from "../../lib/auth"
import { ThemeToggle } from "../../components/theme-toggle"
import { Save, Eye, FileText, Type, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BatchSelector } from "../../components/batch-selector"
import RichTextEditor from "@/rich-text-editor"
import DOMPurify from "dompurify"

export default function EditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedCompany = searchParams.get("company")

  const [selectedCompany, setSelectedCompany] = useState(preselectedCompany || "")
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const [duration, setDuration] = useState("")
  const [author, setAuthor] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCTC] = useState("")
  const [offerType, setOfferType] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
    ],
    content: `
      <h2 style="font-size: 24px; font-weight: bold; margin: 20px 0 12px 0; color: #1f2937;">Overview</h2>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">I had the opportunity to interview for the Software Development Engineer (SDE) position at [Company Name]. The process consisted of an Online Assessment followed by two interview rounds.</p>
      
      <h3 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #374151;">Online Assessment - Date</h3>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">The Online Assessment was conducted on [Date] with a duration of [Duration]. It consisted of:</p>
      <ul style="font-size: 16px; margin: 8px 0; padding-left: 20px;">
        <li>Aptitude questions</li>
        <li>DSA questions</li>
        <li>SQL questions</li>
      </ul>
      
      <h4 style="font-size: 18px; font-weight: bold; margin: 14px 0 6px 0; color: #4b5563;">Aptitude Section</h4>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">Describe your experience with the aptitude section...</p>
      
      <h4 style="font-size: 18px; font-weight: bold; margin: 14px 0 6px 0; color: #4b5563;">DSA Section</h4>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;"><strong>Question 1:</strong> [Problem Title]</p>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">Problem description...</p>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;"><strong>Status:</strong> Successfully solved</p>
      
      <h3 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #374151;">Technical Interview Round</h3>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;"><strong>Duration:</strong> [Duration]</p>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">The interview started with a brief introduction and resume discussion, then moved to technical questions.</p>
      
      <h3 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #374151;">Final Results</h3>
      <p style="font-size: 16px; margin: 8px 0; line-height: 1.6;">Share the outcome and timeline...</p>
      
      <h3 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #374151;">Key Takeaways</h3>
      <ul style="font-size: 16px; margin: 8px 0; padding-left: 20px;">
        <li>Preparation is crucial - Strong DSA and SQL knowledge is essential</li>
        <li>Think out loud - Explain your approach clearly during interviews</li>
        <li>Time management - Practice solving problems within time limits</li>
      </ul>
      
      <h3 style="font-size: 20px; font-weight: bold; margin: 16px 0 8px 0; color: #374151;">Advice for Future Candidates</h3>
      <ul style="font-size: 16px; margin: 8px 0; padding-left: 20px;">
        <li>Focus on problem-solving and optimization</li>
        <li>Practice coding on paper/whiteboard</li>
        <li>Stay calm and communicate your thought process clearly</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: "min-h-[500px] p-6 focus:outline-none text-base leading-relaxed prose max-w-none",
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
      },
    },
    immediatelyRender: false, // Fix SSR hydration mismatch
  })

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)

    // Set default batch to 2026 if no batch is preselected
    async function setDefaultBatch() {
      if (!preselectedCompany) {
        try {
          const defaultBatch = await getBatchByYear(2026)
          if (defaultBatch) {
            setSelectedBatch(defaultBatch.id)
          }
        } catch (error) {
          console.error("Error setting default batch:", error)
        }
      }
    }

    setDefaultBatch()
  }, [router, preselectedCompany])

  const handleSave = async () => {
    if (!selectedBatch || !selectedCompany || !title || !role || !author || !selectionStatus) {
      alert("Please fill in all required fields (Batch, Company, Title, Role, Candidate Name, Selection Status)")
      return
    }

    const content = editor?.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for your experience")
      return
    }

    setIsSaving(true)

    try {
      await saveExperience({
        batchId: selectedBatch,
        companyId: selectedCompany,
        title,
        role,
        duration,
        author,
        content,
        selectionStatus,
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        tags: [], // No default tags
      })

      alert("Experience saved successfully!")
      router.push(`/company/${selectedCompany}`)
    } catch (error) {
      alert("Error saving experience. Please try again.")
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Checking authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant={isPreview ? "outline" : "default"} size="sm" onClick={() => setIsPreview(false)}>
                <Type className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant={isPreview ? "default" : "outline"} size="sm" onClick={() => setIsPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save Experience"}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex justify-center min-h-screen bg-background">
        <main className="w-full max-w-4xl px-6 py-8 space-y-6">
          {/* Experience Details Form */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Share Your Interview Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <Image
                        src={selectedCompanyData.logo || "/placeholder.svg"}
                        alt={`${selectedCompanyData.name} logo`}
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <span className="text-sm text-muted-foreground">Writing for {selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Candidate Name *</Label>
                  <Input
                    id="author"
                    placeholder="e.g., John Doe"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Software Engineer, Data Scientist"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., March 2024"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selection-status">Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(value) => setSelectionStatus(value as "selected" | "not-selected")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctc">CTC (in LPA)</Label>
                  <Input
                    id="ctc"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 12.5"
                    value={ctc}
                    onChange={(e) => setCTC(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-type">Offer Type</Label>
                  <Input
                    id="offer-type"
                    placeholder="e.g., Full-time, Internship, PPO"
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Experience Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., My Software Engineer Interview Experience at Google"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card>
            <CardContent className="p-0">
              {!isPreview && <RichTextEditor editor={editor} />}

              {isPreview && (
                <div className="p-6 bg-card">
                  <div className="mb-6 pb-4 border-b">
                    <div className="flex items-start gap-4 mb-4">
                      {selectedCompanyData && (
                        <Image
                          src={selectedCompanyData.logo || "/placeholder.svg"}
                          alt={`${selectedCompanyData.name} logo`}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      )}
                      <div>
                        <h1 className="text-2xl font-bold mb-2 text-foreground">{title || "Interview Experience Title"}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>
                            <strong>Company:</strong> {selectedCompanyData?.name || "Select Company"}
                          </span>
                          <span>
                            <strong>Role:</strong> {role || "Role Applied For"}
                          </span>
                          <span>
                            <strong>Candidate:</strong> {author || "Candidate Name"}
                          </span>
                          {duration && (
                            <span>
                              <strong>Period:</strong> {duration}
                            </span>
                          )}
                          <span>
                            <strong>Status:</strong>{" "}
                            {selectionStatus === "selected"
                              ? "Selected"
                              : selectionStatus === "not-selected"
                                ? "Not Selected"
                                : "Not specified"}
                          </span>
                          {selectionStatus === "selected" && ctc && (
                            <span>
                              <strong>CTC:</strong> {ctc} LPA
                            </span>
                          )}
                          {selectionStatus === "selected" && offerType && (
                            <span>
                              <strong>Offer Type:</strong> {offerType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: editor?.getHTML() || "Start writing your experience...",
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
