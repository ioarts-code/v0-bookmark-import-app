"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { BookmarkFolder, Bookmark } from "@/types/bookmark"

interface BookmarkTreeProps {
  folder: BookmarkFolder
  level?: number
}

export function BookmarkTree({ folder, level = 0 }: BookmarkTreeProps) {
  return (
    <div className="space-y-2">
      {folder.folders.map((subfolder) => (
        <FolderItem key={subfolder.name} folder={subfolder} level={level} />
      ))}
      {folder.bookmarks.map((bookmark, index) => (
        <BookmarkItem key={`${bookmark.url}-${index}`} bookmark={bookmark} level={level} />
      ))}
    </div>
  )
}

function FolderItem({ folder, level }: { folder: BookmarkFolder; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level === 0)

  return (
    <div>
      <Card className="transition-colors hover:bg-accent">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 p-4 text-left"
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium flex-1">{folder.name}</span>
          <span className="text-xs text-muted-foreground">{folder.totalBookmarks} items</span>
        </button>
      </Card>
      {isExpanded && (
        <div className="mt-2 space-y-2">
          <BookmarkTree folder={folder} level={level + 1} />
        </div>
      )}
    </div>
  )
}

function BookmarkItem({ bookmark, level }: { bookmark: Bookmark; level: number }) {
  return (
    <Card className="transition-colors hover:bg-accent">
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 group"
        style={{ paddingLeft: `${level * 1.5 + 2.75}rem` }}
      >
        {bookmark.favicon ? (
          <img
            src={bookmark.favicon || "/placeholder.svg"}
            alt=""
            className="h-4 w-4 flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="flex-1 truncate group-hover:text-primary transition-colors">{bookmark.name}</span>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </a>
    </Card>
  )
}
