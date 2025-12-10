import type { Bookmark, BookmarkFolder } from "@/types/bookmark"

export function parseBookmarkCSV(csvText: string): BookmarkFolder {
  const lines = csvText.trim().split("\n")

  if (lines.length === 0) {
    throw new Error("CSV file is empty")
  }

  // Parse CSV header
  const headers = parseCSVLine(lines[0])
  const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name")
  const urlIndex = headers.findIndex((h) => h.toLowerCase() === "url")
  const folderIndex = headers.findIndex((h) => h.toLowerCase().includes("folder"))

  if (nameIndex === -1 || urlIndex === -1) {
    throw new Error('CSV must contain "name" and "url" columns')
  }

  // Create root folder
  const root: BookmarkFolder = {
    name: "All Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  // Parse each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const name = values[nameIndex]?.trim()
    const url = values[urlIndex]?.trim()
    const folderPath = folderIndex !== -1 ? values[folderIndex]?.trim() : ""

    if (!name || !url) continue

    const bookmark: Bookmark = {
      name,
      url,
      favicon: getFaviconUrl(url),
    }

    // Add bookmark to appropriate folder
    if (folderPath) {
      const folders = folderPath.split("/").filter((f) => f.trim())
      addBookmarkToFolder(root, folders, bookmark)
    } else {
      root.bookmarks.push(bookmark)
    }
  }

  // Calculate totals
  calculateTotals(root)

  return root
}

export function parseBookmarkHTML(htmlText: string): BookmarkFolder {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, "text/html")

  const root: BookmarkFolder = {
    name: "All Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  // Chrome bookmark HTML structure uses <DT> for items and <DL> for nested lists
  const processNode = (node: Element, currentFolder: BookmarkFolder) => {
    const children = Array.from(node.children)

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (child.tagName === "DT") {
        const link = child.querySelector("a")
        const folderHeading = child.querySelector("h3")

        if (link) {
          // It's a bookmark
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
        } else if (folderHeading) {
          // It's a folder
          const folderName = folderHeading.textContent?.trim() || "Untitled Folder"
          const newFolder: BookmarkFolder = {
            name: folderName,
            folders: [],
            bookmarks: [],
            totalBookmarks: 0,
            totalFolders: 0,
          }
          currentFolder.folders.push(newFolder)

          // Look for the next DL sibling which contains the folder's contents
          const nextSibling = children[i + 1]
          if (nextSibling && nextSibling.tagName === "DL") {
            processNode(nextSibling, newFolder)
          }
        }
      } else if (child.tagName === "DL") {
        // Nested list
        processNode(child, currentFolder)
      }
    }
  }

  // Find the main bookmark list
  const mainDL = doc.querySelector("dl")
  if (mainDL) {
    processNode(mainDL, root)
  } else {
    throw new Error("Invalid HTML bookmark file format")
  }

  // Calculate totals
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
      inQuotes = !inQuotes
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

  for (const folderName of folderPath) {
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

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch {
    return ""
  }
}
