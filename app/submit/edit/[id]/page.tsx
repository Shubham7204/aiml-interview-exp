"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent, type Editor } from "@tiptap/react"

// Tiptap Extensions
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TiptapLink from "@tiptap/extension-link"
import TiptapImage from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CompanySelector } from "../../../../components/company-selector"
import { BatchSelector } from "../../../../components/batch-selector"
import { ThemeToggle } from "../../../../components/theme-toggle"
import { Footer } from "../../../../components/footer"

// Icons
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image as ImageIcon, Table as TableIcon,
  Undo, Redo, Pilcrow, ArrowLeft, Save, Plus, Trash2, FileText, CheckCircle, AlertTriangle
} from "lucide-react"

// Logic
import { 
  getExperienceById, updateExperience,
  getExperienceRounds, deleteExperienceRounds, saveExperienceRounds,
  getExperienceResources, deleteExperienceResources, saveExperienceResources
} from "../../../../lib/database"
import { companies } from "../../../../data/companies"
import Link from "next/link"
import NextImage from "next/image"
import DOMPurify from "dompurify"
import type { Experience, ExperienceRound, ExperienceResource } from "../../../../types/company"

const TOPICS = [
  "DSA", "Machine Learning", "Deep Learning", "DBMS/SQL", "OOPs", "OS", "Computer Networks",
  "Aptitude", "System Design", "HR", "Puzzles", "Statistics", "NLP", "Computer Vision",
  "Cloud/DevOps", "Web Development", "Python", "Java", "C++", "Other"
]

const ROUND_TYPES = [
  { value: "online_assessment", label: "Online Assessment" },
  { value: "technical", label: "Technical Round" },
  { value: "hr", label: "HR Round" },
  { value: "group_discussion", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "coding", label: "Coding Round" },
  { value: "other", label: "Other" }
]

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
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}><Bold className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} data-active={editor.isActive("italic")}><Italic className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} data-active={editor.isActive("underline")}><UnderlineIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} data-active={editor.isActive("strike")}><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} data-active={editor.isActive("code")}><Code className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} data-active={editor.isActive("heading", { level: 1 })}><Heading1 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} data-active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} data-active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().setParagraph().run()} data-active={editor.isActive("paragraph")}><Pilcrow className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBulletList().run()} data-active={editor.isActive("bulletList")}><List className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleOrderedList().run()} data-active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBlockquote().run()} data-active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="h-4 w-4" /></Button>
      <ToolbarSeparator />
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
    </div>
  )
}

interface StudentEditPageProps {
  params: Promise<{ id: string }>
}

export default function StudentEditPage({ params }: StudentEditPageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  
  const [experience, setExperience] = useState<Experience | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  // Basic Info State
  const [author, setAuthor] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [sapId, setSapId] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [experienceType, setExperienceType] = useState<"internship" | "placement" | "">("")
  const [role, setRole] = useState("")
  const [selectionStatus, setSelectionStatus] = useState<"selected" | "not-selected" | "">("")
  const [ctc, setCtc] = useState("")
  const [offerType, setOfferType] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "">("")
  const [title, setTitle] = useState("")
  const [adminNote, setAdminNote] = useState("")

  // Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  // Rounds
  const [rounds, setRounds] = useState<(Omit<ExperienceRound, "id"> & { tempId: number })[]>([])
  const [nextRoundId, setNextRoundId] = useState(1)

  // Resources
  const [resources, setResources] = useState<(Omit<ExperienceResource, "id"> & { tempId: number })[]>([])
  const [nextResourceId, setNextResourceId] = useState(1)

  // Tips
  const [tips, setTips] = useState("")

  const selectedCompanyData = companies.find((c) => c.id === selectedCompany)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TiptapLink.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer hover:text-blue-800' } }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert prose-sm sm:prose-sm lg:prose-base xl:prose-base min-h-[400px] w-full p-4 focus:outline-none max-w-none",
      },
      handlePaste: (view, event, slice) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((file) => /image/i.test(file.type));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        });
        return true;
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
    async function loadData() {
      try {
        const foundExperience = await getExperienceById(id)
        if (!foundExperience) {
          router.push("/")
          return
        }

        // Only allow editing if status is needs_revision
        if (foundExperience.status !== "needs_revision") {
          setLoading(false)
          return
        }

        setExperience(foundExperience)
        
        // Basic Info
        setAuthor(foundExperience.author || "")
        setAuthorEmail(foundExperience.authorEmail || "")
        setSapId(foundExperience.sapId || "")
        setSelectedCompany(foundExperience.companyId || "")
        setSelectedBatch(foundExperience.batchId || "")
        setExperienceType(foundExperience.experienceType || "")
        setRole(foundExperience.role || "")
        setSelectionStatus(foundExperience.selectionStatus || "")
        setCtc(foundExperience.ctc ? String(foundExperience.ctc) : "")
        setOfferType(foundExperience.offerType || "")
        setDuration(foundExperience.duration || "")
        setDifficulty(foundExperience.difficulty || "")
        setTitle(foundExperience.title || "")
        setAdminNote(foundExperience.adminReviewNote || "")
        setTips(foundExperience.tips || "")
        setSelectedTopics(foundExperience.topicsCovered || [])

        // Set Editor content
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(foundExperience.content)
        }

        // Fetch and map Rounds
        const fetchedRounds = await getExperienceRounds(id)
        if (fetchedRounds && fetchedRounds.length > 0) {
          setRounds(fetchedRounds.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextRoundId(fetchedRounds.length + 1)
        }

        // Fetch and map Resources
        const fetchedResources = await getExperienceResources(id)
        if (fetchedResources && fetchedResources.length > 0) {
          setResources(fetchedResources.map((r, index) => ({
            ...r,
            tempId: index + 1
          })))
          setNextResourceId(fetchedResources.length + 1)
        }

      } catch (error) {
        console.error("Error loading experience details:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [id, router, editor])


  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  const addRound = () => {
    setRounds([...rounds, { tempId: nextRoundId, roundNumber: rounds.length + 1, roundName: "", roundType: "technical", duration: "", topics: "", description: "" }])
    setNextRoundId(nextRoundId + 1)
  }

  const updateRound = (tempId: number, field: string, value: string) => {
    setRounds(rounds.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeRound = (tempId: number) => {
    setRounds(rounds.filter(r => r.tempId !== tempId).map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const addResource = () => {
    setResources([...resources, { tempId: nextResourceId, resourceName: "", resourceLink: "" }])
    setNextResourceId(nextResourceId + 1)
  }

  const updateResource = (tempId: number, field: string, value: string) => {
    setResources(resources.map(r => r.tempId === tempId ? { ...r, [field]: value } : r))
  }

  const removeResource = (tempId: number) => {
    setResources(resources.filter(r => r.tempId !== tempId))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !experience) return
    
    if (!author || !authorEmail || !selectedCompany || !selectedBatch || !role || !selectionStatus || !title) {
      alert("Please fill in all required fields.")
      return
    }

    const content = editor.getHTML() || ""
    if (!content.trim() || content === "<p></p>") {
      alert("Please write some content for the detailed experience.")
      return
    }

    setIsSaving(true)
    try {
      // 1. Update main experience - SET STATUS BACK TO PENDING
      await updateExperience({
        ...experience,
        batchId: selectedBatch,
        companyId: selectedCompany,
        title, 
        role, 
        duration, 
        author, 
        authorEmail,
        content, 
        selectionStatus: selectionStatus as "selected" | "not-selected",
        ctc: ctc ? Math.round(Number.parseFloat(ctc) * 100) / 100 : null,
        offerType: offerType || null,
        status: "pending", 
        sapId: sapId || null,
        experienceType: (experienceType as "internship" | "placement") || null,
        difficulty: (difficulty as "easy" | "medium" | "hard") || null,
        topicsCovered: selectedTopics,
        tips: tips || null,
      })

      // 2. Overwrite rounds (Delete old, insert new)
      const validRounds = rounds.filter(r => r.roundName.trim() !== "")
      await deleteExperienceRounds(experience.id)
      if (validRounds.length > 0) {
        await saveExperienceRounds(experience.id, validRounds.map(({ tempId, ...rest }) => rest))
      }

      // 3. Overwrite resources (Delete old, insert new)
      const validResources = resources.filter(r => r.resourceName.trim() !== "")
      await deleteExperienceResources(experience.id)
      if (validResources.length > 0) {
        await saveExperienceResources(experience.id, validResources.map(({ tempId, ...rest }) => rest))
      }

      setIsSuccess(true)
      window.scrollTo(0, 0)
    } catch (error) {
      alert("Error submitting experience. Please try again.")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">Loading experience...</div>
      </div>
    )
  }

  if (experience && experience.status !== "needs_revision" && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-6 border-orange-200 dark:border-orange-900">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription className="mt-2 text-base">
              This submission is currently marked as <strong>{experience.status}</strong>. It can only be edited if an admin explicitly requests a revision.
            </CardDescription>
            <Button asChild className="mt-6"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card shadow-sm border-b sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg text-center p-8 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800 dark:text-green-300">Successfully Resubmitted!</CardTitle>
            <CardDescription className="text-base mt-4">
              Thank you for updating your interview experience. It has been sent back to the admins for review. You can safely close this page.
            </CardDescription>
            <Button asChild className="mt-8"><Link href="/">Return to Home</Link></Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Link></Button>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} size="sm" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white"><Save className="w-4 h-4 mr-2" />{isSaving ? "Submitting..." : "Resubmit to Admin"}</Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Revise Your Experience
          </h1>
          <p className="text-muted-foreground">Please review the admin note below and make the necessary updates.</p>
        </div>

        {adminNote && (
          <div className="mb-8 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-800 dark:text-orange-400 mb-2">
              <AlertTriangle className="w-5 h-5" /> Admin Review Note
            </h3>
            <p className="text-orange-700 dark:text-orange-300 whitespace-pre-wrap">{adminNote}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Student Name *</Label>
                  <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorEmail">Email Address (For notifications) *</Label>
                  <Input id="authorEmail" type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sapId">SAP ID</Label>
                  <Input id="sapId" placeholder="6000000000" value={sapId} onChange={(e) => setSapId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <CompanySelector onCompanySelect={setSelectedCompany} selectedCompany={selectedCompany} />
                  {selectedCompanyData && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
                      <NextImage src={selectedCompanyData.logo || "/placeholder.svg"} alt="logo" width={24} height={24} className="rounded" />
                      <span className="text-sm text-muted-foreground">{selectedCompanyData.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Batch *</Label>
                  <BatchSelector onBatchSelect={setSelectedBatch} selectedBatch={selectedBatch} />
                </div>
                <div className="space-y-2">
                  <Label>Experience Type</Label>
                  <Select value={experienceType} onValueChange={(v: any) => setExperienceType(v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role Applied For *</Label>
                  <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Selection Status *</Label>
                  <Select value={selectionStatus} onValueChange={(v: any) => setSelectionStatus(v)} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="not-selected">Not Selected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Period</Label>
                  <Input id="duration" placeholder="e.g., March 2026" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                
                {selectionStatus === "selected" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ctc">CTC (LPA)</Label>
                      <Input id="ctc" type="number" step="0.1" placeholder="12.5" value={ctc} onChange={(e) => setCtc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offerType">Offer Type</Label>
                      <Input id="offerType" placeholder="FTE, 6-month intern" value={offerType} onChange={(e) => setOfferType(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2 mt-4">
                <Label>Overall Difficulty</Label>
                <RadioGroup value={difficulty} onValueChange={(v: any) => setDifficulty(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="r-easy" />
                    <Label htmlFor="r-easy" className="font-normal cursor-pointer">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="r-medium" />
                    <Label htmlFor="r-medium" className="font-normal cursor-pointer">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="r-hard" />
                    <Label htmlFor="r-hard" className="font-normal cursor-pointer">Hard</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="title">Experience Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Topics Covered */}
          <Card>
            <CardHeader>
              <CardTitle>2. Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(topic => (
                  <Badge 
                    key={topic} 
                    variant={selectedTopics.includes(topic) ? "default" : "outline"}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => toggleTopic(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Interview Rounds */}
          <Card>
            <CardHeader>
              <CardTitle>3. Interview Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round) => (
                <div key={round.tempId} className="p-4 border rounded-lg bg-muted/30 relative">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => removeRound(round.tempId)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold mb-4 text-primary">Round {round.roundNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Round Name *</Label>
                      <Input placeholder="Online Assessment, Technical Round 1..." value={round.roundName} onChange={(e) => updateRound(round.tempId, "roundName", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Round Type *</Label>
                      <Select value={round.roundType} onValueChange={(v) => updateRound(round.tempId, "roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {ROUND_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input placeholder="45 minutes" value={round.duration || ""} onChange={(e) => updateRound(round.tempId, "duration", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Topics Discussed</Label>
                      <Input placeholder="DSA (Arrays, DP), OS basics" value={round.topics || ""} onChange={(e) => updateRound(round.tempId, "topics", e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description / Questions Asked</Label>
                      <Textarea placeholder="What happened in this round? What questions were asked?" value={round.description || ""} onChange={(e) => updateRound(round.tempId, "description", e.target.value)} rows={3} />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRound} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Section 4: Detailed Experience */}
          <Card>
            <CardHeader>
              <CardTitle>4. Detailed Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-input bg-transparent rounded-md overflow-hidden">
                <Toolbar editor={editor!} />
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Tips & Advice */}
          <Card>
            <CardHeader>
              <CardTitle>5. Tips & Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Tips for juniors..." value={tips} onChange={(e) => setTips(e.target.value)} rows={4} />
            </CardContent>
          </Card>

          {/* Section 6: Preparation Resources */}
          <Card>
            <CardHeader>
              <CardTitle>6. Preparation Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((res) => (
                <div key={res.tempId} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Resource Name *</Label>
                    <Input placeholder="Striver's SDE Sheet" value={res.resourceName} onChange={(e) => updateResource(res.tempId, "resourceName", e.target.value)} required />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label>Link (Optional)</Label>
                    <Input placeholder="https://..." type="url" value={res.resourceLink || ""} onChange={(e) => updateResource(res.tempId, "resourceLink", e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeResource(res.tempId)} className="shrink-0 mt-2 sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResource} className="border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Resource
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto px-8 bg-green-600 hover:bg-green-700 text-white">
              {isSaving ? "Submitting..." : <><Save className="w-4 h-4 mr-2" /> Resubmit to Admin</>}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
