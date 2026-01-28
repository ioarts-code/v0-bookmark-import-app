"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FolderOpen, Download } from "lucide-react"
import { BookmarkUpload } from "@/components/bookmark-upload"
import { BookmarkTree } from "@/components/bookmark-tree"
import type { BookmarkFolder } from "@/types/bookmark"

export default function Home() {
  const [bookmarks, setBookmarks] = useState<BookmarkFolder | null>(null)

  const handleBookmarksImport = (parsedBookmarks: BookmarkFolder) => {
    setBookmarks(parsedBookmarks)
  }

  const handleExport = () => {
    if (!bookmarks) return

    const html = generateBookmarkHTML(bookmarks)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bookmarks-${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generateBookmarkHTML = (folder: BookmarkFolder): string => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`

    const generateFolderHTML = (f: BookmarkFolder, indent = "    "): string => {
      let result = ""

      // Add bookmarks in this folder
      for (const bookmark of f.bookmarks) {
        result += `${indent}<DT><A HREF="${bookmark.url}">${bookmark.name}</A>\n`
      }

      // Add subfolders
      for (const subfolder of f.folders) {
        result += `${indent}<DT><H3>${subfolder.name}</H3>\n`
        result += `${indent}<DL><p>\n`
        result += generateFolderHTML(subfolder, indent + "    ")
        result += `${indent}</DL><p>\n`
      }

      return result
    }

    html += generateFolderHTML(folder)
    html += `</DL><p>\n`

    return html
  }

  const handleDeleteFolder = (folderPath: string[]) => {
    if (!bookmarks) return

    const newBookmarks = JSON.parse(JSON.stringify(bookmarks)) as BookmarkFolder

    // Navigate to parent folder
    let current = newBookmarks
    for (let i = 0; i < folderPath.length - 1; i++) {
      const folder = current.folders.find((f) => f.name === folderPath[i])
      if (!folder) return
      current = folder
    }

    // Remove the folder
    const folderName = folderPath[folderPath.length - 1]
    current.folders = current.folders.filter((f) => f.name !== folderName)

    // Recalculate totals
    recalculateTotals(newBookmarks)
    setBookmarks(newBookmarks)
  }

  const handleDeleteBookmark = (folderPath: string[], bookmarkUrl: string) => {
    if (!bookmarks) return

    const newBookmarks = JSON.parse(JSON.stringify(bookmarks)) as BookmarkFolder

    // Navigate to the folder
    let current = newBookmarks
    for (const folderName of folderPath) {
      const folder = current.folders.find((f) => f.name === folderName)
      if (!folder) return
      current = folder
    }

    // Remove the bookmark
    current.bookmarks = current.bookmarks.filter((b) => b.url !== bookmarkUrl)

    // Recalculate totals
    recalculateTotals(newBookmarks)
    setBookmarks(newBookmarks)
  }

  const handleEditFolder = (folderPath: string[], newName: string) => {
    if (!bookmarks) return

    const newBookmarks = JSON.parse(JSON.stringify(bookmarks)) as BookmarkFolder

    // Navigate to parent folder
    let current = newBookmarks
    for (let i = 0; i < folderPath.length - 1; i++) {
      const folder = current.folders.find((f) => f.name === folderPath[i])
      if (!folder) return
      current = folder
    }

    // Update the folder name
    const folderName = folderPath[folderPath.length - 1]
    const folderToEdit = current.folders.find((f) => f.name === folderName)
    if (folderToEdit) {
      folderToEdit.name = newName
    }

    setBookmarks(newBookmarks)
  }

  const handleEditBookmark = (folderPath: string[], oldUrl: string, newName: string, newUrl: string) => {
    if (!bookmarks) return

    const newBookmarks = JSON.parse(JSON.stringify(bookmarks)) as BookmarkFolder

    // Navigate to the folder
    let current = newBookmarks
    for (const folderName of folderPath) {
      const folder = current.folders.find((f) => f.name === folderName)
      if (!folder) return
      current = folder
    }

    // Update the bookmark
    const bookmarkToEdit = current.bookmarks.find((b) => b.url === oldUrl)
    if (bookmarkToEdit) {
      bookmarkToEdit.name = newName
      bookmarkToEdit.url = newUrl
    }

    setBookmarks(newBookmarks)
  }

  const recalculateTotals = (folder: BookmarkFolder): { bookmarks: number; folders: number } => {
    let totalBookmarks = folder.bookmarks.length
    let totalFolders = folder.folders.length

    for (const subfolder of folder.folders) {
      const subtotals = recalculateTotals(subfolder)
      totalBookmarks += subtotals.bookmarks
      totalFolders += subtotals.folders
    }

    folder.totalBookmarks = totalBookmarks
    folder.totalFolders = totalFolders

    return { bookmarks: totalBookmarks, folders: totalFolders }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FolderOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-semibold text-xl text-balance">Bookmark Manager</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!bookmarks ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl p-8 md:p-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-semibold text-2xl text-balance">Import Your Bookmarks</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                    Upload your Chrome bookmarks CSV or HTML file to organize and access your saved links with their folder structure preserved
                  </p>
                </div>
                <BookmarkUpload onImport={handleBookmarksImport} />
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-xl text-balance">Your Bookmarks</h2>
                <p className="text-muted-foreground text-sm">
                  {bookmarks.totalBookmarks} bookmark{bookmarks.totalBookmarks !== 1 ? "s" : ""} in{" "}
                  {bookmarks.totalFolders} folder{bookmarks.totalFolders !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <BookmarkUpload onImport={handleBookmarksImport} variant="secondary" />
              </div>
            </div>
            <BookmarkTree
              folder={bookmarks}
              onDeleteFolder={handleDeleteFolder}
              onDeleteBookmark={handleDeleteBookmark}
              onEditFolder={handleEditFolder}
              onEditBookmark={handleEditBookmark}
            />
          </div>
        )}
      </main>
    </div>
  )
}
