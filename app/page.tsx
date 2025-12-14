"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Upload, FolderOpen } from "lucide-react"
import { BookmarkUpload } from "@/components/bookmark-upload"
import { BookmarkTree } from "@/components/bookmark-tree"
import type { BookmarkFolder } from "@/types/bookmark"

export default function Home() {
  const [bookmarks, setBookmarks] = useState<BookmarkFolder | null>(null)

  const handleBookmarksImport = (parsedBookmarks: BookmarkFolder) => {
    setBookmarks(parsedBookmarks)
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
                  <p className="text-muted-foreground text-pretty leading-relaxed max-w-md">
                    Upload your Chrome bookmarks CSV or HTML file to organize and access your saved links with their
                    folder structure preserved.
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
              <BookmarkUpload onImport={handleBookmarksImport} variant="secondary" />
            </div>
            <BookmarkTree folder={bookmarks} />
          </div>
        )}
      </main>
    </div>
  )
}
