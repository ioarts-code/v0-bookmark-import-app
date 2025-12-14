import type { Bookmark, BookmarkFolder } from "@/types/bookmark"

export function parseBookmarkCSV(csvText: string): BookmarkFolder {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")

  if (lines.length === 0) {
    throw new Error("CSV file is empty")
  }

  const headers = parseCSVLine(lines[0])

  // Try to find the correct column indices (case-insensitive and flexible matching)
  const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name" || h.toLowerCase() === "title")
  const urlIndex = headers.findIndex((h) => h.toLowerCase() === "url" || h.toLowerCase() === "link")
  const folderIndex = headers.findIndex((h) => h.toLowerCase().includes("folder") || h.toLowerCase().includes("path"))

  if (nameIndex === -1 || urlIndex === -1) {
    throw new Error('CSV must contain "name" or "title" and "url" or "link" columns')
  }

  const root: BookmarkFolder = {
    name: "Your Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)

    const name = values[nameIndex]?.trim()
    const url = values[urlIndex]?.trim()
    const folderPath = folderIndex !== -1 ? values[folderIndex]?.trim() : ""

    if (!name || !url || url === "") {
      continue
    }

    const bookmark: Bookmark = {
      name,
      url,
      favicon: getFaviconUrl(url),
    }

    if (folderPath && folderPath !== "") {
      const folders = folderPath
        .split(/[/\\]+/)
        .map((f) => f.trim())
        .filter((f) => {
          if (!f) return false
          const lower = f.toLowerCase()
          if (lower === "bookmarks" || lower === "bokmärken") return false
          if (lower === "bookmark bar" || lower === "bokmärkesfältet") return false
          if (lower === "bookmarks bar" || lower === "bokmärkesfält") return false
          if (lower === "mobile bookmarks" || lower === "mobila bokmärken") return false
          if (lower === "other bookmarks" || lower === "andra bokmärken") return false
          return true
        })

      if (folders.length > 0) {
        addBookmarkToFolder(root, folders, bookmark)
      } else {
        root.bookmarks.push(bookmark)
      }
    } else {
      root.bookmarks.push(bookmark)
    }
  }

  calculateTotals(root)
  removeEmptyFolders(root)
  calculateTotals(root)

  return root
}

export function parseBookmarkHTML(htmlText: string): BookmarkFolder {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, "text/html")

  const root: BookmarkFolder = {
    name: "Your Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  const processNode = (element: Element, currentFolder: BookmarkFolder) => {
    const dtElements = Array.from(element.children).filter((child) => child.tagName === "DT")

    for (const dt of dtElements) {
      const h3 = dt.querySelector(":scope > h3")
      if (h3) {
        const folderName = h3.textContent?.trim() || "Untitled Folder"

        const lowerName = folderName.toLowerCase()
        if (lowerName === "synced bookmarks" || lowerName === "synkroniserade bokmärken") {
          continue
        }

        const newFolder: BookmarkFolder = {
          name: folderName,
          folders: [],
          bookmarks: [],
          totalBookmarks: 0,
          totalFolders: 0,
        }
        currentFolder.folders.push(newFolder)

        const dl = dt.querySelector(":scope > dl")
        if (dl) {
          processNode(dl, newFolder)
        }
      } else {
        const link = dt.querySelector(":scope > a")
        if (link) {
          const name = link.textContent?.trim() || "Untitled"
          const url = link.getAttribute("href") || ""

          if (url) {
            const bookmark: Bookmark = {
              name,
              url,
              favicon: getFaviconUrl(url),
            }
            currentFolder.bookmarks.push(bookmark)
          }
        }
      }
    }
  }

  const mainDL = doc.querySelector("dl")
  if (mainDL) {
    processNode(mainDL, root)
  } else {
    throw new Error("Invalid HTML bookmark file format - no DL element found")
  }

  calculateTotals(root)
  removeEmptyFolders(root)
  calculateTotals(root)

  return root
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)

  return result.map((v) => v.trim().replace(/^"|"$/g, ""))
}

function addBookmarkToFolder(root: BookmarkFolder, folderPath: string[], bookmark: Bookmark): void {
  let currentFolder = root

  for (let i = 0; i < folderPath.length; i++) {
    const folderName = folderPath[i]
    let folder = currentFolder.folders.find((f) => f.name === folderName)

    if (!folder) {
      folder = {
        name: folderName,
        folders: [],
        bookmarks: [],
        totalBookmarks: 0,
        totalFolders: 0,
      }
      currentFolder.folders.push(folder)
    }

    currentFolder = folder
  }

  currentFolder.bookmarks.push(bookmark)
}

function calculateTotals(folder: BookmarkFolder): number {
  let totalBookmarks = folder.bookmarks.length
  let totalFolders = folder.folders.length

  for (const subfolder of folder.folders) {
    const subtotals = calculateTotals(subfolder)
    totalBookmarks += subtotals
    totalFolders += subfolder.folders.length
  }

  folder.totalBookmarks = totalBookmarks
  folder.totalFolders = totalFolders

  return totalBookmarks
}

function removeEmptyFolders(folder: BookmarkFolder): void {
  folder.folders.forEach((subfolder) => removeEmptyFolders(subfolder))
  folder.folders = folder.folders.filter((subfolder) => subfolder.bookmarks.length > 0 || subfolder.folders.length > 0)
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch {
    return ""
  }
}
