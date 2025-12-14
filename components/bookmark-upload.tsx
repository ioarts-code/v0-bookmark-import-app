"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
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
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

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
      const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      const lines = normalizedText.split("\n")
      const preview = lines.slice(0, 15).join("\n")

      setDebugInfo(
        `File: ${file.name}\nType: ${isCSV ? "CSV" : "HTML"}\nSize: ${text.length} chars\nTotal lines: ${lines.length}\nNon-empty lines: ${lines.filter((l) => l.trim()).length}\n\n=== First 15 lines ===\n${preview}`,
      )

      const bookmarks: BookmarkFolder = isCSV ? parseBookmarkCSV(text) : parseBookmarkHTML(text)

      onImport(bookmarks)
      toast({
        title: "Bookmarks imported successfully",
        description: `Imported ${bookmarks.totalBookmarks} bookmarks from ${bookmarks.totalFolders} folders.`,
      })

      setTimeout(() => setDebugInfo(null), 10000)
    } catch (error) {
      console.error("[v0] Import error:", error)
      setDebugInfo(`ERROR: ${error instanceof Error ? error.message : "Failed to parse"}`)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse bookmark file.",
        variant: "destructive",
      })
    }

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

      {debugInfo && (
        <div className="fixed bottom-4 right-4 max-w-2xl max-h-96 overflow-auto bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50 shadow-2xl border border-white/20">
          <button onClick={() => setDebugInfo(null)} className="absolute top-2 right-2 text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
    </>
  )
}
