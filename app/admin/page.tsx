"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, LogOut, Users, Eye, GraduationCap, LineChart, Upload, Building2 } from "lucide-react"
import Link from "next/link"
import { isAuthenticated, logout } from "../../lib/auth"
import { ThemeToggle } from "../../components/theme-toggle"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase";

function PDFUploadAdmin() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(""); setError("");
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('important-pdfs').upload(fileName, file);
      if (error) throw error;
      setSuccess("File uploaded successfully!");
      event.target.value = '';
    } catch (err: any) {
      setError("Error uploading file: " + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        accept=".pdf"
        onChange={uploadFile}
        disabled={uploading}
        className="hidden"
        id="admin-pdf-upload"
      />
      <Button asChild disabled={uploading} className="cursor-pointer mb-2">
        <label htmlFor="admin-pdf-upload">
          {uploading ? 'Uploading...' : 'Choose PDF File'}
        </label>
      </Button>
      {success && <p className="text-green-600 text-sm mt-1">{success}</p>}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    } else {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/")
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
              <img src="/djsce-logo.png" alt="DJSCE Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Department of AIML, DJSCE</p>
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
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, Admin</h2>
            <p className="text-muted-foreground">Manage AIML placement experiences from here.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PDF Upload Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Upload Important PDF</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <PDFUploadAdmin />
          </CardContent>
        </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Add Experience</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create a new placement experience for the latest AIML batch.</p>
                <Button asChild className="w-full">
                  <Link href="/editor">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Experience
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>View Public Site</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See how the public site looks to visitors.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    <Eye className="w-4 h-4 mr-2" />
                    View Latest Batch
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>AIML 25 Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">View placement experiences from AIML 25 batch.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/aiml-25">
                    <Users className="w-4 h-4 mr-2" />
                    View AIML 25
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Manage Batches</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Add new batches and manage existing ones.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/batches">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Manage Batches
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <CardTitle>Manage Companies</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Add company logos, descriptions, websites, and industries.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/companies">
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Companies
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>View Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">See website usage analytics from PostHog.</p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/analytics">
                    <LineChart className="w-4 h-4 mr-2" />
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
