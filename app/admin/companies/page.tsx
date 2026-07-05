"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, ImagePlus, LogOut, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getCompanies, createCompany, uploadCompanyLogo } from "../../../lib/database"
import { isAuthenticated, logout } from "../../../lib/auth"
import type { Company } from "../../../types/company"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CompanyManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [dialogState, setDialogState] = useState({ open: false, title: "", description: "" })
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
  })

  const companyId = useMemo(() => slugify(form.name), [form.name])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    loadCompanies()
  }, [router])

  useEffect(() => {
    if (!logoFile) {
      setPreviewUrl("")
      return
    }

    const objectUrl = URL.createObjectURL(logoFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [logoFile])

  async function loadCompanies() {
    try {
      setCompanies(await getCompanies())
    } catch (error) {
      console.error("Error loading companies:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    logout()
    router.push("/")
  }

  function showDialog(title: string, description: string) {
    setDialogState({ open: true, title, description })
  }

  async function handleSave() {
    if (!form.name || !form.description || !form.industry || !logoFile) {
      showDialog("Missing details", "Please fill in the company name, description, industry, and upload a logo.")
      return
    }

    if (!companyId) {
      showDialog("Invalid company name", "Please use a company name that can generate a valid ID.")
      return
    }

    if (companies.some((company) => company.id === companyId)) {
      showDialog("Duplicate company", "A company with this generated ID already exists. Please adjust the name.")
      return
    }

    setSaving(true)
    try {
      const logoUrl = await uploadCompanyLogo(logoFile, companyId)
      await createCompany({
        id: companyId,
        name: form.name.trim(),
        logo: logoUrl,
        description: form.description.trim(),
        website: form.website.trim() || undefined,
        industry: form.industry.trim(),
      })

      setForm({ name: "", description: "", industry: "", website: "" })
      setLogoFile(null)
      await loadCompanies()
      showDialog("Company added", "The company was added successfully.")
    } catch (error) {
      console.error("Error adding company:", error)
      showDialog(
        "Unable to save company",
        error instanceof Error ? error.message : "Please check your Supabase setup and try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl font-medium text-foreground">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" asChild>
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Add Company
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g., Google"
                />
                {companyId && <p className="text-xs text-muted-foreground">ID: {companyId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
                  placeholder="e.g., Technology"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short company description shown on company cards."
                  className="min-h-28"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo *</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
                />
                {previewUrl && (
                  <div className="w-20 h-20 rounded-lg border bg-background p-2">
                    <img src={previewUrl} alt="Logo preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <ImagePlus className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Uploading..." : "Save Company"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Companies</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((company) => (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-lg border bg-background p-2">
                        <Image
                          src={company.logo || "/placeholder.svg"}
                          alt={`${company.name} logo`}
                          width={40}
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-foreground">{company.name}</h2>
                        <p className="text-sm text-muted-foreground">{company.industry}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{company.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.title}</DialogTitle>
            <DialogDescription>{dialogState.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogState((prev) => ({ ...prev, open: false }))}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
