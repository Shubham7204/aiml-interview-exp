"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image" // Renamed to avoid JSX conflict
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CompanySelector } from "../../components/company-selector"
import { BatchSelector } from "../../components/batch-selector"
import { ThemeToggle } from "../../components/theme-toggle"

// Lucide Icons for Toolbar
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Save, Eye, FileText, Type
} from "lucide-react"

// Data and Logic
import { getActiveBatch, getCompanies, saveExperience, getBatchByYear } from "../../lib/database"
import { isAuthenticated } from "../../lib/auth"
import Link from "next/link"
import NextImage from "next/image" // Renamed to avoid conflict
import DOMPurify from "dompurify"
import type { Company } from "../../types/company"

// Toolbar Component (defined inside for single-file structure)
const Toolbar = ({ editor }: { editor: Editor }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("Enter the image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  const ToolbarSeparator = () => <div className="w-[1px] h-6 bg-input mx-1" />

  return (
    <div className="p-2 border-b border-input flex flex-wrap items-center gap-1 sticky top-0 bg-background z-10">
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
      {editor.isActive('table') && (
        <>
          <ToolbarSeparator />
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().addColumnBefore().run()}>Add Col Before</Button>
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().deleteColumn().run()}>Delete Col</Button>
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row After</Button>
          <Button variant="outline" size="sm" onClick={() => editor.chain().focus().deleteRow().run()}>Delete Row</Button>
          <Button variant="destructive" size="sm" onClick={() => editor.chain().focus().deleteTable().run()}>Delete Table</Button>
        </>
      )}
    </div>
  )
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedCompany = searchParams.get("company")
  const preselectedBatch = searchParams.get("batch")

  const [selectedCompany, setSelectedCompany] = useState(preselectedCompany || "")
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const [duration, setDuration] = useState("")
  const [author, setAuthor] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCTC] = useState("")
  const [offerType, setOfferType] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
        },
      }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: `<h2>Overview</h2><p>I had the opportunity to interview for the <strong>Software Development Engineer (SDE)</strong> position at [Company Name]. The process consisted of an Online Assessment followed by two interview rounds.</p><h3>Online Assessment - Date</h3><p>The Online Assessment was conducted on [Date] with a duration of [Duration]. It consisted of:</p><ul><li>Aptitude questions</li><li>DSA questions</li><li>SQL questions</li></ul><h3>Technical Interview Round</h3><p><strong>Duration:</strong> [Duration]</p><p>The interview started with a brief introduction and resume discussion, then moved to technical questions.</p><h3>Final Results</h3><p>Share the outcome and timeline...</p><h3>Key Takeaways & Advice</h3><p>Here are some key takeaways and advice for future candidates:</p><table><thead><tr><th>Topic</th><th>Advice</th></tr></thead><tbody><tr><td>DSA</td><td>Focus on problem-solving and optimization. Practice on LeetCode.</td></tr><tr><td>Communication</td><td>Explain your approach clearly. Think out loud.</td></tr><tr><td>Time Management</td><td>Practice solving problems within set time limits.</td></tr></tbody></table>`,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[400px] w-full p-4 focus:outline-none",
      },
      handlePaste: (view, event, slice) => {
        // Check if the pasted content contains files
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) {
          return false; // No files, let Tiptap handle it
        }

        // Check if the first file is an image
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) {
          return false; // No images, let Tiptap handle it
        }
        
        // Prevent the default paste behavior
        event.preventDefault();

        // For each image, read it as a Base64 data URL and insert it
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
              // Use the editor instance from the component scope
              const editorInstance = editor;
              if (editorInstance) {
                editorInstance.chain().focus().setImage({ src }).run();
              }
            }
          };
          reader.readAsDataURL(file);
        });

        return true; // We've handled the paste
      },
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ['img', 'table', 'tbody', 'thead', 'tr', 'th', 'td'],
          ADD_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style', 'colspan', 'rowspan']
        })
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)
    async function setDefaultBatch() {
      if (preselectedBatch) {
        setSelectedBatch(preselectedBatch)
        return
      }

      try {
        const defaultBatch = (await getBatchByYear(2027)) || (await getActiveBatch())
        if (defaultBatch) setSelectedBatch(defaultBatch.id)
      } catch (error) {
        console.error("Error setting default batch:", error)
      }
    }
    async function loadCompanies() {
      try {
        setCompanies(await getCompanies())
      } catch (error) {
        console.error("Error loading companies:", error)
      }
    }
    setDefaultBatch()
    loadCompanies()
  }, [router, preselectedBatch])

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
        title, role, duration, author, content, selectionStatus,
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        tags: [],
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
        <div className="text-xl font-medium text-foreground">Checking authentication...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/admin"><ArrowLeft className="w-4 h-4 mr-2" />Back to Admin</Link></Button>
            <div className="flex items-center gap-2">
              <Button variant={isPreview ? "outline" : "default"} size="sm" onClick={() => setIsPreview(false)}><Type className="w-4 h-4 mr-2" />Edit</Button>
              <Button variant={isPreview ? "default" : "outline"} size="sm" onClick={() => setIsPreview(true)}><Eye className="w-4 h-4 mr-2" />Preview</Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}><Save className="w-4 h-4 mr-2" />{isSaving ? "Saving..." : "Save"}</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2"><FileText className="w-5 h-5" />Share Your Interview Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                {selectedCompanyData && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                    <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt={`${selectedCompanyData.name} logo`} width={24} height={24} className="rounded" />
                    <span className="text-sm text-muted-foreground">Writing for {selectedCompanyData.name}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label htmlFor="batch">Batch *</Label><BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} /></div>
              <div className="space-y-2"><Label htmlFor="author">Candidate Name *</Label><Input id="author" placeholder="e.g., John Doe" value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="role">Role Applied For *</Label><Input id="role" placeholder="e.g., Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="duration">Interview Period</Label><Input id="duration" placeholder="e.g., March 2024" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
              <div className="space-y-2">
                <Label htmlFor="selection-status">Selection Status *</Label>
                <Select value={selectionStatus} onValueChange={(value) => setSelectionStatus(value as "selected" | "not-selected")}><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="selected">Selected</SelectItem><SelectItem value="not-selected">Not Selected</SelectItem></SelectContent></Select>
              </div>
              <div className="space-y-2"><Label htmlFor="ctc">CTC (in LPA)</Label><Input id="ctc" type="number" step="0.1" placeholder="e.g., 12.5" value={ctc} onChange={(e) => setCTC(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="offer-type">Offer Type</Label><Input id="offer-type" placeholder="e.g., Full-time, Internship" value={offerType} onChange={(e) => setOfferType(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="title">Experience Title *</Label><Input id="title" placeholder="e.g., My Interview Experience at Google for SDE-1" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          {isPreview ? (
            <CardContent className="p-6">
              <div className="mb-6 pb-4 border-b">
                <div className="flex items-start gap-4 mb-4">
                  {selectedCompanyData && <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt={`${selectedCompanyData.name} logo`} width={48} height={48} className="rounded" />}
                  <div>
                    <h1 className="text-2xl font-bold mb-2 text-foreground">{title || "Interview Experience Title"}</h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span><strong>Company:</strong> {selectedCompanyData?.name || "N/A"}</span>
                      <span><strong>Role:</strong> {role || "N/A"}</span>
                      <span><strong>Candidate:</strong> {author || "N/A"}</span>
                      {duration && <span><strong>Period:</strong> {duration}</span>}
                      <span><strong>Status:</strong> {selectionStatus === "selected" ? "Selected" : selectionStatus === "not-selected" ? "Not Selected" : "N/A"}</span>
                      {selectionStatus === "selected" && ctc && <span><strong>CTC:</strong> {ctc} LPA</span>}
                      {selectionStatus === "selected" && offerType && <span><strong>Offer Type:</strong> {offerType}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }} />
            </CardContent>
          ) : (
            <div className="border border-input bg-transparent rounded-md overflow-hidden">
              <Toolbar editor={editor!} />
              <EditorContent editor={editor} />
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
