'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';
import { Footer } from '@/components/footer';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, Building2, Menu, Upload, Eye, Download, Edit, Trash2, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import type { FileObject } from '@supabase/storage-js'

export default function ImportantPage() {
    const [files, setFiles] = useState<FileObject[]>([])
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false);

    // Check admin on mount
    useEffect(() => {
        setIsAdmin(isAuthenticated());
        loadFiles();
    }, [])

    // Load all files from the bucket
    const loadFiles = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase.storage
                .from('important-pdfs')
                .list('', {
                    limit: 100,
                    offset: 0,
                })

            if (error) {
                throw error;
            }

            setFiles(data || [])
        } catch (error: any) {
            console.error('Error loading files:', error?.message || error)
            alert('Error loading files')
        } finally {
            setLoading(false)
        }
    }

    // Upload PDF file
    const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]

            if (!file) return

            if (file.type !== 'application/pdf') {
                alert('Please select a PDF file')
                return
            }

            const fileName = `${Date.now()}_${file.name}`

            const { data, error } = await supabase.storage
                .from('important-pdfs')
                .upload(fileName, file)

            if (error) {
                throw error;
            }

            alert('File uploaded successfully!')
            loadFiles() // Refresh the file list
            event.target.value = '' // Clear input
        } catch (error: any) {
            console.error('Error uploading file:', error?.message || error)
            alert('Error uploading file')
        } finally {
            setUploading(false)
        }
    }

    // View PDF in new tab
    const viewFile = async (fileName: string) => {
        try {
            const { data } = supabase.storage
                .from('important-pdfs')
                .getPublicUrl(fileName)

            if (data?.publicUrl) {
                window.open(data.publicUrl, '_blank')
            }
        } catch (error: any) {
            console.error('Error viewing file:', error?.message || error)
            alert('Error viewing file')
        }
    }

    // Download file
    const downloadFile = async (fileName: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('important-pdfs')
                .download(fileName)

            if (error) {
                throw error;
            }

            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error: any) {
            console.error('Error downloading file:', error?.message || error)
            alert('Error downloading file')
        }
    }

    // Rename file
    const renameFile = async (oldName: string) => {
        const newName = prompt('Enter new name (without .pdf extension):', oldName.replace('.pdf', ''))

        if (!newName || newName === oldName.replace('.pdf', '')) return

        try {
            // Download the file
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('important-pdfs')
                .download(oldName)

            if (downloadError) {
                throw downloadError;
            }

            // Upload with new name
            const { error: uploadError } = await supabase.storage
                .from('important-pdfs')
                .upload(`${newName}.pdf`, fileData)

            if (uploadError) {
                throw uploadError;
            }

            // Delete old file
            const { error: deleteError } = await supabase.storage
                .from('important-pdfs')
                .remove([oldName])

            if (deleteError) {
                throw deleteError;
            }

            alert('File renamed successfully!')
            loadFiles() // Refresh the file list
        } catch (error: any) {
            console.error('Error renaming file:', error?.message || error)
            alert('Error renaming file')
        }
    }

    // Delete file
    const deleteFile = async (fileName: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return

        try {
            const { error } = await supabase.storage
                .from('important-pdfs')
                .remove([fileName])

            if (error) {
                throw error;
            }

            alert('File deleted successfully!')
            loadFiles() // Refresh the file list
        } catch (error: any) {
            console.error('Error deleting file:', error?.message || error)
            alert('Error deleting file')
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="bg-card shadow-sm border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/djsce-logo.png" alt="DJSCE Logo" className="h-8 w-auto" />
                            <span className="font-semibold text-lg text-foreground hidden sm:block">
                                AIML Placement Experiences
                            </span>
                        </Link>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/aiml-25" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                <GraduationCap className="w-4 h-4" />
                                AIML-25 (PDF)
                            </Link>
                            <Link href="/companies" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                <Building2 className="w-4 h-4" />
                                All Companies
                            </Link>
                            <ThemeToggle />
                        </nav>
                        {/* Mobile Navigation */}
                        <div className="md:hidden flex items-center">
                            <ThemeToggle />
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="ml-2">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                                    <nav className="flex flex-col gap-6 pt-8">
                                        <Link href="/" className="flex items-center gap-2 mb-4">
                                            <img src="/djsce-logo.png" alt="DJSCE Logo" className="h-8 w-auto" />
                                            <span className="font-semibold">Home</span>
                                        </Link>
                                        <Link href="/aiml-25" className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                                            <GraduationCap className="w-5 h-5 mr-2" />
                                            AIML-25
                                        </Link>
                                        <Link href="/companies" className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors">
                                            <Building2 className="w-5 h-5 mr-2" />
                                            All Companies
                                        </Link>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-primary mb-4">Important Interviews Experience (by other depts)</h1>
                    </div>

                    {/* Upload Section (Admins only) */}
                    {isAdmin && (
                        <div className="mb-8">
                            <div className="bg-card border-2 border-dashed border-border rounded-lg p-8 text-center">
                                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Upload PDF Files</h3>
                                <p className="text-muted-foreground mb-4">Select PDF files to upload to the important documents collection</p>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={uploadFile}
                                    disabled={uploading}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <Button
                                    asChild
                                    disabled={uploading}
                                    className="cursor-pointer"
                                >
                                    <label htmlFor="pdf-upload">
                                        {uploading ? 'Uploading...' : 'Choose PDF Files'}
                                    </label>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Files List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-semibold">Uploaded Documents</h2>
                            <Button
                                onClick={loadFiles}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-pulse">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-muted-foreground">Loading files...</p>
                                </div>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="text-center py-12 bg-card rounded-lg border">
                                <div className="text-muted-foreground mb-4">
                                    <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg">No files uploaded yet</p>
                                    <p className="text-sm">Upload your first PDF to get started</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {files.map((file) => (
                                    <div
                                        key={file.name}
                                        className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="w-full max-w-full overflow-x-auto">
                                                    <h3
                                                        className="font-semibold text-base sm:text-lg truncate mb-1 whitespace-nowrap"
                                                        title={file.name}
                                                        style={{ maxWidth: '100%' }}
                                                    >
                                                        {file.name}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                    <span>Size: {file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) : 'N/A'} MB</span>
                                                    <span>Modified: {file.updated_at ? new Date(file.updated_at).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    onClick={() => viewFile(file.name)}
                                                    variant="default"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>

                                                <Button
                                                    onClick={() => downloadFile(file.name)}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download
                                                </Button>

                                                {isAdmin && (
                                                    <>
                                                        <Button
                                                            onClick={() => renameFile(file.name)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                            Rename
                                                        </Button>
                                                        <Button
                                                            onClick={() => deleteFile(file.name)}
                                                            variant="destructive"
                                                            size="sm"
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}