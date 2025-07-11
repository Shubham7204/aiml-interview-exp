"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import DOMPurify from "dompurify"

// UI and Icon Imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold, Strikethrough, Italic, List, ListOrdered, Heading1, Heading2,
  Heading3, Underline as UnderlineIcon, Quote, Save, Eye, FileText, Type, ArrowLeft,
} from "lucide-react"

// Other Component & Data Imports
import { CompanySelector } from "../../../components/company-selector"
import { BatchSelector } from "../../../components/batch-selector"
import { companies } from "../../../data/companies"
import { getExperienceById, updateExperience } from "../../../lib/database"
import { isAuthenticated } from "../../../lib/auth"
import { ThemeToggle } from "../../../components/theme-toggle"
import type { Experience } from "../../../types/company"
import Link from "next/link"
import Image from "next/image"


// ====================================================================================
// START: RICH TEXT EDITOR TOOLBAR COMPONENT (Defined in the same file)
// ====================================================================================

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-muted/50">
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("heading", { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("underline")} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("bulletList")} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive("orderedList")} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>
       <Toggle size="sm" pressed={editor.isActive("blockquote")} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Toggle>
    </div>
  )
}
// ====================================================================================
// END: RICH TEXT EDITOR TOOLBAR COMPONENT
// ====================================================================================


interface EditExperiencePageProps {
  params: Promise<{ id: string }>
}

export default function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = React.use(params)
  const router = useRouter()

  const [experience, setExperience] = useState<Experience | null>(null)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const [duration, setDuration] = useState("")
  const [author, setAuthor] = useState("")
  const [isPreview, setIsPreview] = useState(false) // Default to edit mode
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [selectionStatus, setSelectionStatus] = useState<Experience["selectionStatus"] | "">("")
  const [ctc, setCTC] = useState("")
  const [offerType, setOfferType] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3], // Allow H1, H2, H3
        },
      }),
      Underline,
    ],
    editorProps: {
      attributes: {
        // This is CRITICAL. It applies Tailwind's typography styles.
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl p-4 focus:outline-none min-h-[500px] max-w-none w-full dark:prose-invert",
      },
      // Sanitize pasted HTML. Tiptap intelligently handles markdown-like text pasting automatically.
      transformPastedHTML(html) {
        return DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ALLOWED_TAGS: [
            "p", "h1", "h2", "h3", "strong", "em", "u", "ul", "ol", "li",
            "blockquote", "code", "br", "a", "strike"
          ],
          ALLOWED_ATTR: ['href', 'target', 'rel'],
        })
      },
    },
    content: "", // Content is set in useEffect
    immediatelyRender: false, // Fix SSR hydration mismatch
  })

  // Load experience data
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setAuthChecked(true)

    async function loadExperience() {
      try {
        const foundExperience = await getExperienceById(id)
        if (foundExperience) {
          setExperience(foundExperience)
          setSelectedCompany(foundExperience.companyId)
          setSelectedBatch(foundExperience.batchId)
          setTitle(foundExperience.title)
          setRole(foundExperience.role)
          setDuration(foundExperience.duration || "")
          setAuthor(foundExperience.author)
          setSelectionStatus(foundExperience.selectionStatus)
          setCTC(foundExperience.ctc ? String(foundExperience.ctc) : "")
          setOfferType(foundExperience.offerType || "")
        } else {
          router.push("/admin")
        }
      } catch (error) {
        console.error("Error loading experience:", error)
        router.push("/admin")
      } finally {
        setLoading(false)
      }
    }

    loadExperience()
  }, [id, router])

  // Set editor content when both editor and experience are ready
  useEffect(() => {
    if (editor && experience && !editor.isDestroyed) {
      editor.commands.setContent(experience.content)
    }
  }, [editor, experience])

  const handleSave = async () => {
    if (!editor || !experience) return
    if (!selectedCompany || !title || !role || !author || !selectionStatus || !selectedBatch) {
      alert("Please fill in all required fields")
      return
    }
    const content = editor.getHTML()
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for your experience")
      return
    }
    setIsSaving(true)
    try {
      await updateExperience({
        ...experience,
        companyId: selectedCompany,
        batchId: selectedBatch,
        title,
        role,
        duration,
        author,
        content,
        selectionStatus,
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
      })
      alert("Experience updated successfully!")
      router.push(`/experience/${experience.id}`)
    } catch (error) {
      alert("Error updating experience. Please try again.")
      console.error("Update error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">{!authChecked ? "Checking authentication..." : "Loading experience..."}</div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium text-foreground">Experience not found</p>
          <Button asChild className="mt-4"><Link href="/admin">Go to Admin</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href={`/experience/${experience.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Experience
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant={isPreview ? "outline" : "default"} size="sm" onClick={() => setIsPreview(false)}>
                <Type className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button variant={isPreview ? "default" : "outline"} size="sm" onClick={() => setIsPreview(true)}>
                <Eye className="w-4 h-4 mr-2" /> Preview
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Updating..." : "Update"}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex justify-center bg-background">
        <main className="w-full max-w-4xl px-6 py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" /> Edit Interview Experience
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
                      <span className="text-sm text-muted-foreground">Editing for {selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="batch">Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selection-status">Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(value) => setSelectionStatus(value as Experience["selectionStatus"])}>
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
                <div className="space-y-2 md:col-span-2">
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
                <Input id="title" placeholder="e.g., My SWE Interview Experience at Google" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {isPreview ? (
                <div className="p-6 bg-card">
                  <div
                    className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "Start writing..." }}
                  />
                </div>
              ) : (
                <div className="rounded-md border border-input bg-card">
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}