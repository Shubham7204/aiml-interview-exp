"use client"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, LogOut, ArrowLeft, GraduationCap, Save, X } from "lucide-react"
import Link from "next/link"
import { isAuthenticated, logout } from "../../../lib/auth"
import { useRouter } from "next/navigation"
import { getBatches, createBatch } from "../../../lib/database"
import type { Batch } from "../../../types/company"
import { ThemeToggle } from "../../../components/theme-toggle"

export default function BatchManagementPage() {
  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<Batch[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const defaultNewBatchYear = 2027
  const [dialogState, setDialogState] = useState({ open: false, title: "", description: "" })
  const [newBatch, setNewBatch] = useState({
    year: defaultNewBatchYear,
    name: "AIML 27",
    description: "AIML Batch of 2027",
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      loadBatches()
    }
  }, [router])

  const loadBatches = async () => {
    try {
      const fetchedBatches = await getBatches()
      setBatches(fetchedBatches)
    } catch (error) {
      console.error("Error loading batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const showDialog = (title: string, description: string) => {
    setDialogState({ open: true, title, description })
  }

  const handleAddBatch = async () => {
    if (!newBatch.name || !newBatch.year) {
      showDialog("Missing details", "Please fill in the batch name and year before creating a batch.")
      return
    }

    if (batches.some((batch) => batch.year === newBatch.year)) {
      showDialog(
        "Duplicate batch",
        `${newBatch.name} (${newBatch.year}) already exists. Please choose a different year.`,
      )
      return
    }

    setSaving(true)
    try {
      await createBatch(newBatch)
      await loadBatches()
      setShowAddForm(false)
      setNewBatch({
        year: defaultNewBatchYear,
        name: "AIML 27",
        description: "AIML Batch of 2027",
        isActive: true,
      })
      showDialog("Batch created", "The batch was created successfully.")
    } catch (error) {
      console.error("Error creating batch:", error)
      showDialog("Unable to create batch", error instanceof Error ? error.message : "Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const generateBatchName = (year: number) => {
    const shortYear = year.toString().slice(-2)
    setNewBatch((prev) => ({
      ...prev,
      name: `AIML ${shortYear}`,
      description: `AIML Batch of ${year}`,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-foreground">Loading...</div>
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
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Batch Management</h1>
                <p className="text-sm text-muted-foreground">Manage AIML batches</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Add Batch Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Add New Batch
                </CardTitle>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  variant={showAddForm ? "outline" : "default"}
                  size="sm"
                >
                  {showAddForm ? <X className="w-4 h-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                  {showAddForm ? "Cancel" : "Add Batch"}
                </Button>
              </div>
            </CardHeader>
            {showAddForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newBatch.year}
                      onChange={(e) => {
                        const year = Number.parseInt(e.target.value)
                        setNewBatch((prev) => ({ ...prev, year }))
                        if (year) generateBatchName(year)
                      }}
                      min={2020}
                      max={2030}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Batch Name *</Label>
                    <Input
                      id="name"
                      value={newBatch.name}
                      onChange={(e) => setNewBatch((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., AIML 27"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newBatch.description}
                    onChange={(e) => setNewBatch((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., AIML Batch of 2027"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newBatch.isActive}
                    onCheckedChange={(checked) => setNewBatch((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active Batch</Label>
                </div>
                <Button onClick={handleAddBatch} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Creating..." : "Create Batch"}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Existing Batches */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Existing Batches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Year: {batch.year}</p>
                      </div>
                      <Badge variant={batch.isActive ? "default" : "secondary"}>
                        {batch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {batch.description && <p className="text-sm text-muted-foreground mb-4">{batch.description}</p>}
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(batch.createdAt).toLocaleDateString()}
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
