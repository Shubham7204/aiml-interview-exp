"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanySelector } from "../../components/company-selector"
import { companies } from "../../data/companies"
import { saveExperience } from "../../lib/database"
import { isAuthenticated } from "../../lib/auth"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  ImageIcon,
  Save,
  Eye,
  FileText,
  Type,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
  const editorRef = useRef<HTMLDivElement>(null)

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)
  }, [router])

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }, [])

  const insertHTML = useCallback((html: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const div = document.createElement("div")
      div.innerHTML = html
      const fragment = document.createDocumentFragment()
      while (div.firstChild) {
        fragment.appendChild(div.firstChild)
      }
      range.insertNode(fragment)
    }
  }, [])

  const insertTable = () => {
    const tableHTML = `
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Round</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Type</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Duration</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Round 1</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Online Test</td>
          <td style="border: 1px solid #ccc; padding: 8px;">90 minutes</td>
        </tr>
      </table>
    `
    insertHTML(tableHTML)
  }

  const insertCodeBlock = () => {
    const codeHTML = `
      <pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; margin: 10px 0; overflow-x: auto;">
        <code>// Sample coding question solution
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}</code>
      </pre>
    `
    insertHTML(codeHTML)
  }

  const handleSave = async () => {
    if (!selectedCompany || !title || !role || !author) {
      alert("Please fill in all required fields (Company, Title, Role, Candidate Name)")
      return
    }

    const content = editorRef.current?.innerHTML || ""
    if (!content.trim()) {
      alert("Please write some content for your experience")
      return
    }

    setIsSaving(true)

    try {
      const savedExperience = await saveExperience({
        companyId: selectedCompany,
        title,
        role,
        duration,
        author,
        content,
        tags: ["Technical Round", "HR Round"], // You can make this dynamic later
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium">Checking authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Experience Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded">
                    <Image
                      src={selectedCompanyData.logo || "/placeholder.svg"}
                      alt={`${selectedCompanyData.name} logo`}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Writing for {selectedCompanyData.name}</span>
                  </div>
                )}
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
            {!isPreview && (
              <div className="border rounded-lg">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
                  {/* Text Formatting */}
                  <div className="flex items-center gap-1">
                    <Select onValueChange={(value) => executeCommand("formatBlock", value)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="div">Normal</SelectItem>
                        <SelectItem value="h1">Heading 1</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="h4">Heading 4</SelectItem>
                        <SelectItem value="p">Paragraph</SelectItem>
                      </SelectContent>
                    </Select>
                    <Separator orientation="vertical" className="h-6" />
                  </div>

                  {/* Basic Formatting */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => executeCommand("bold")} className="h-8 w-8 p-0">
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => executeCommand("italic")} className="h-8 w-8 p-0">
                      <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCommand("underline")}
                      className="h-8 w-8 p-0"
                    >
                      <Underline className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCommand("strikeThrough")}
                      className="h-8 w-8 p-0"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                  </div>

                  {/* Lists and Elements */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCommand("insertUnorderedList")}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => executeCommand("insertOrderedList")}
                      className="h-8 w-8 p-0"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={insertTable} className="h-8 w-8 p-0">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={insertCodeBlock} className="h-8 w-8 p-0">
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[500px] p-6 focus:outline-none text-base leading-relaxed"
                  style={{
                    lineHeight: "1.6",
                    fontSize: "16px",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `
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
                  }}
                />
              </div>
            )}

            {isPreview && (
              <div className="p-6 bg-white">
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
                      <h1 className="text-2xl font-bold mb-2">{title || "Interview Experience Title"}</h1>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="prose max-w-none"
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: editorRef.current?.innerHTML || "Start writing your experience...",
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
