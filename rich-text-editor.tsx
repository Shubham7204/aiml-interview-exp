"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  Save,
  Eye,
  FileText,
  Type,
  Undo,
  Redo,
} from "lucide-react"

export default function Component() {
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [duration, setDuration] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

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
          <td style="border: 1px solid #ccc; padding: 8px;">Header 1</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Header 2</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Header 3</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 2</td>
          <td style="border: 1px solid #ccc; padding: 8px;">Cell 3</td>
        </tr>
      </table>
    `
    insertHTML(tableHTML)
  }

  const insertCodeBlock = () => {
    const codeHTML = `
      <pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; margin: 10px 0; overflow-x: auto;">
        <code>// Your code here</code>
      </pre>
    `
    insertHTML(codeHTML)
  }

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || ""
    const experienceData = {
      title,
      company,
      role,
      duration,
      content,
    }
    console.log("Saving experience:", experienceData)
    // Here you would typically save to a database or local storage
    alert("Experience saved successfully!")
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Placement Experience Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Experience Title</Label>
              <Input
                id="title"
                placeholder="e.g., Software Engineering Internship Experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft, Amazon"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position</Label>
              <Input
                id="role"
                placeholder="e.g., Software Engineer Intern"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., June 2024 - August 2024"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Experience Details</CardTitle>
            <div className="flex gap-2">
              <Button variant={isPreview ? "outline" : "default"} size="sm" onClick={() => setIsPreview(false)}>
                <Type className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant={isPreview ? "default" : "outline"} size="sm" onClick={() => setIsPreview(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <Button variant="ghost" size="sm" onClick={() => executeCommand("underline")} className="h-8 w-8 p-0">
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

                {/* Alignment */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand("justifyLeft")}
                    className="h-8 w-8 p-0"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand("justifyCenter")}
                    className="h-8 w-8 p-0"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand("justifyRight")}
                    className="h-8 w-8 p-0"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand("justifyFull")}
                    className="h-8 w-8 p-0"
                  >
                    <AlignJustify className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                </div>

                {/* Lists */}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeCommand("formatBlock", "blockquote")}
                    className="h-8 w-8 p-0"
                  >
                    <Quote className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                </div>

                {/* Insert Elements */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = prompt("Enter link URL:")
                      if (url) executeCommand("createLink", url)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const url = prompt("Enter image URL:")
                      if (url) executeCommand("insertImage", url)
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={insertTable} className="h-8 w-8 p-0">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={insertCodeBlock} className="h-8 w-8 p-0">
                    <Code className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                </div>

                {/* Colors */}
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    onChange={(e) => executeCommand("foreColor", e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    title="Text Color"
                  />
                  <input
                    type="color"
                    onChange={(e) => executeCommand("hiliteColor", e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    title="Background Color"
                  />
                  <Separator orientation="vertical" className="h-6" />
                </div>

                {/* Undo/Redo */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => executeCommand("undo")} className="h-8 w-8 p-0">
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => executeCommand("redo")} className="h-8 w-8 p-0">
                    <Redo className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[400px] p-4 focus:outline-none"
                style={{ lineHeight: "1.6" }}
                dangerouslySetInnerHTML={{
                  __html: `
                    <h2>My Placement Experience</h2>
                    <p>Start writing about your placement experience here...</p>
                    <h3>Application Process</h3>
                    <p>Describe how you applied, the selection process, interviews, etc.</p>
                    <h3>Work Environment & Culture</h3>
                    <p>Share details about the company culture, work environment, team dynamics...</p>
                    <h3>Projects & Responsibilities</h3>
                    <p>Detail the projects you worked on and your key responsibilities...</p>
                    <h3>Skills Learned</h3>
                    <ul>
                      <li>Technical skills gained</li>
                      <li>Soft skills developed</li>
                      <li>Tools and technologies used</li>
                    </ul>
                    <h3>Challenges & Solutions</h3>
                    <p>Discuss any challenges you faced and how you overcame them...</p>
                    <h3>Key Takeaways & Advice</h3>
                    <p>Share your key learnings and advice for future applicants...</p>
                  `,
                }}
              />
            </div>
          )}

          {isPreview && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="mb-6 pb-4 border-b">
                <h1 className="text-2xl font-bold mb-2">{title || "Experience Title"}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>
                    <strong>Company:</strong> {company || "Company Name"}
                  </span>
                  <span>
                    <strong>Role:</strong> {role || "Role/Position"}
                  </span>
                  <span>
                    <strong>Duration:</strong> {duration || "Duration"}
                  </span>
                </div>
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: editorRef.current?.innerHTML || "No content yet...",
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
