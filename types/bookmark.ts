export interface Bookmark {
  name: string
  url: string
  favicon?: string
}

export interface BookmarkFolder {
  name: string
  folders: BookmarkFolder[]
  bookmarks: Bookmark[]
  totalBookmarks: number
  totalFolders: number
}
