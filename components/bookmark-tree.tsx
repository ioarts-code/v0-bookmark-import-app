"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, ExternalLink, X, Pencil } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { BookmarkFolder, Bookmark } from "@/types/bookmark"

interface BookmarkTreeProps {
  folder: BookmarkFolder
  level?: number
  onDeleteFolder?: (folderPath: string[]) => void
  onDeleteBookmark?: (folderPath: string[], bookmarkUrl: string) => void
  onEditFolder?: (folderPath: string[], newName: string) => void
  onEditBookmark?: (folderPath: string[], oldUrl: string, newName: string, newUrl: string) => void
  currentPath?: string[]
}

export function BookmarkTree({
  folder,
  level = 0,
  onDeleteFolder,
  onDeleteBookmark,
  onEditFolder,
  onEditBookmark,
  currentPath = [],
}: BookmarkTreeProps) {
  return (
    <div className="space-y-3">
      {folder.folders.map((subfolder) => (
        <FolderItem
          key={subfolder.name}
          folder={subfolder}
          level={level}
          onDeleteFolder={onDeleteFolder}
          onDeleteBookmark={onDeleteBookmark}
          onEditFolder={onEditFolder}
          onEditBookmark={onEditBookmark}
          currentPath={[...currentPath, subfolder.name]}
        />
      ))}
      {folder.bookmarks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {folder.bookmarks.map((bookmark, index) => (
            <BookmarkItem
              key={`${bookmark.url}-${index}`}
              bookmark={bookmark}
              level={level}
              currentPath={currentPath}
              onDelete={() => onDeleteBookmark?.(currentPath, bookmark.url)}
              onEdit={(newName: string, newUrl: string) => onEditBookmark?.(currentPath, bookmark.url, newName, newUrl)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FolderItem({
  folder,
  level,
  onDeleteFolder,
  onDeleteBookmark,
  onEditFolder,
  onEditBookmark,
  currentPath,
}: {
  folder: BookmarkFolder
  level: number
  onDeleteFolder?: (folderPath: string[]) => void
  onDeleteBookmark?: (folderPath: string[], bookmarkUrl: string) => void
  onEditFolder?: (folderPath: string[], newName: string) => void
  onEditBookmark?: (folderPath: string[], oldUrl: string, newName: string, newUrl: string) => void
  currentPath: string[]
}) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState(folder.name)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteFolder?.(currentPath)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditName(folder.name)
    setIsEditDialogOpen(true)
  }

  const handleEditSave = () => {
    if (editName.trim() && editName !== folder.name) {
      onEditFolder?.(currentPath, editName.trim())
    }
    setIsEditDialogOpen(false)
  }

  return (
    <div>
      <Card className="transition-colors hover:bg-accent">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 py-2 px-3 cursor-pointer"
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <Folder className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="font-medium flex-1 text-sm truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{folder.totalBookmarks}</span>
          <button
            onClick={handleEditClick}
            className="p-1 hover:bg-primary/10 rounded transition-colors"
            aria-label="Edit folder"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-destructive/10 rounded transition-colors"
            aria-label="Delete folder"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Change the name of this folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isExpanded && (
        <div className="mt-2">
          <BookmarkTree
            folder={folder}
            level={level + 1}
            onDeleteFolder={onDeleteFolder}
            onDeleteBookmark={onDeleteBookmark}
            onEditFolder={onEditFolder}
            onEditBookmark={onEditBookmark}
            currentPath={currentPath}
          />
        </div>
      )}
    </div>
  )
}

function BookmarkItem({
  bookmark,
  level,
  currentPath,
  onDelete,
  onEdit,
}: {
  bookmark: Bookmark
  level: number
  currentPath: string[]
  onDelete: () => void
  onEdit: (newName: string, newUrl: string) => void
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState(bookmark.name)
  const [editUrl, setEditUrl] = useState(bookmark.url)

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete()
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditName(bookmark.name)
    setEditUrl(bookmark.url)
    setIsEditDialogOpen(true)
  }

  const handleEditSave = () => {
    if (editName.trim() && editUrl.trim()) {
      onEdit(editName.trim(), editUrl.trim())
    }
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <Card className="transition-colors hover:bg-accent h-full">
        <div className="flex items-center h-full">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2 px-3 group flex-1 min-w-0"
          >
            {bookmark.favicon ? (
              <img
                src={bookmark.favicon || "/placeholder.svg"}
                alt=""
                className="h-3.5 w-3.5 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="flex-1 text-sm truncate group-hover:text-primary transition-colors leading-tight">
              {bookmark.name}
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </a>
          <button
            onClick={handleEditClick}
            className="p-2 hover:bg-primary/10 transition-colors"
            aria-label="Edit bookmark"
          >
            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-destructive/10 transition-colors"
            aria-label="Delete bookmark"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </Card>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
            <DialogDescription>Change the name or URL of this bookmark.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-name">Bookmark Name</Label>
              <Input
                id="bookmark-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter bookmark name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookmark-url">URL</Label>
              <Input
                id="bookmark-url"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
