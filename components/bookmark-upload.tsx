"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { parseBookmarkCSV, parseBookmarkHTML } from "@/lib/parse-bookmarks"
import { useToast } from "@/hooks/use-toast"
import type { BookmarkFolder } from "@/types/bookmark"

interface BookmarkUploadProps {
  onImport: (bookmarks: BookmarkFolder) => void
  variant?: "default" | "secondary"
}

export function BookmarkUpload({ onImport, variant = "default" }: BookmarkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isCSV = file.name.endsWith(".csv")
    const isHTML = file.name.endsWith(".html") || file.name.endsWith(".htm")

    if (!isCSV && !isHTML) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or HTML file exported from Chrome.",
        variant: "destructive",
      })
      return
    }

    try {
      const text = await file.text()
      const bookmarks = isCSV ? parseBookmarkCSV(text) : parseBookmarkHTML(text)
      onImport(bookmarks)
      toast({
        title: "Bookmarks imported successfully",
        description: `Imported ${bookmarks.totalBookmarks} bookmarks from ${bookmarks.totalFolders} folders.`,
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse bookmark file.",
        variant: "destructive",
      })
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".csv,.html,.htm" onChange={handleFileChange} className="sr-only" />
      <Button onClick={handleFileSelect} variant={variant} size="lg" className="gap-2">
        <Upload className="h-4 w-4" />
        {variant === "default" ? "Upload Bookmarks" : "Import New File"}
      </Button>
    </>
  )
}
