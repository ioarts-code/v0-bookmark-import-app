import type { Bookmark, BookmarkFolder } from "@/types/bookmark"

export function parseBookmarkCSV(csvText: string): BookmarkFolder {
  console.log("[v0] Starting CSV parse")
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")

  if (lines.length === 0) {
    throw new Error("CSV file is empty")
  }

  const headers = parseCSVLine(lines[0])

  console.log("[v0] CSV Headers:", headers)
  console.log("[v0] Total lines in CSV:", lines.length)

  // Try to find the correct column indices (case-insensitive and flexible matching)
  const nameIndex = headers.findIndex((h) => h.toLowerCase() === "name" || h.toLowerCase() === "title")
  const urlIndex = headers.findIndex((h) => h.toLowerCase() === "url" || h.toLowerCase() === "link")
  const folderIndex = headers.findIndex((h) => h.toLowerCase().includes("folder") || h.toLowerCase().includes("path"))

  console.log("[v0] Column indices - name:", nameIndex, "url:", urlIndex, "folder:", folderIndex)

  if (nameIndex === -1 || urlIndex === -1) {
    console.error("[v0] Headers found:", headers)
    throw new Error('CSV must contain "name" or "title" and "url" or "link" columns')
  }

  const root: BookmarkFolder = {
    name: "Your Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  let processedCount = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)

    const name = values[nameIndex]?.trim()
    const url = values[urlIndex]?.trim()
    const folderPath = folderIndex !== -1 ? values[folderIndex]?.trim() : ""

    // Log first 5 rows for debugging
    if (i <= 5) {
      console.log(`[v0] Row ${i}:`)
      console.log(`  Raw line: "${line.substring(0, 100)}..."`)
      console.log(`  Parsed values:`, values)
      console.log(`  Name: "${name}"`)
      console.log(`  URL: "${url}"`)
      console.log(`  Folder Path: "${folderPath}"`)
    }

    if (!name || !url || url === "") {
      console.log(`[v0] Skipping row ${i} - missing name or URL`)
      continue
    }

    const bookmark: Bookmark = {
      name,
      url,
      favicon: getFaviconUrl(url),
    }

    if (folderPath && folderPath !== "") {
      const folders = folderPath
        .split(/[/\\]/)
        .map((f) => f.trim())
        .filter((f) => {
          if (!f) return false
          const lower = f.toLowerCase()
          // Filter out root bookmark folders that shouldn't be shown
          if (lower === "bookmarks" || lower === "bokmärken") return false
          if (lower === "bookmark bar" || lower === "bokmärkesfältet") return false
          if (lower === "bookmarks bar") return false
          if (lower === "mobile bookmarks") return false
          return true
        })

      if (i <= 5) {
        console.log(`  Filtered folders:`, folders)
      }

      if (folders.length > 0) {
        addBookmarkToFolder(root, folders, bookmark)
      } else {
        root.bookmarks.push(bookmark)
      }
    } else {
      root.bookmarks.push(bookmark)
    }

    processedCount++
  }

  console.log("[v0] Total bookmarks processed:", processedCount)
  console.log("[v0] Bookmarks in root:", root.bookmarks.length)
  console.log("[v0] Folders in root:", root.folders.length)

  calculateTotals(root)
  removeEmptyFolders(root)
  calculateTotals(root)

  console.log("[v0] Final structure:", root)
  console.log("[v0] Final totals - bookmarks:", root.totalBookmarks, "folders:", root.totalFolders)

  return root
}

export function parseMobileBookmarkCSV(csvText: string): BookmarkFolder {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")

  if (lines.length === 0) {
    throw new Error("CSV file is empty")
  }

  const headers = parseCSVLine(lines[0])

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

    if (!name || !url || url === "") continue

    const bookmark: Bookmark = {
      name,
      url,
      favicon: getFaviconUrl(url),
    }

    if (folderPath && folderPath !== "") {
      const folders = folderPath
        .split(/[/\\]/)
        .map((f) => f.trim())
        .filter((f) => f !== "" && f.toLowerCase() !== "bookmarks" && f.toLowerCase() !== "bokmärken")

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
    name: "All Bookmarks",
    folders: [],
    bookmarks: [],
    totalBookmarks: 0,
    totalFolders: 0,
  }

  const processNode = (node: Element, currentFolder: BookmarkFolder) => {
    const children = Array.from(node.children)

    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (child.tagName === "DT") {
        const link = child.querySelector("a")
        const folderHeading = child.querySelector("h3")

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
        } else if (folderHeading) {
          const folderName = folderHeading.textContent?.trim() || "Untitled Folder"
          const newFolder: BookmarkFolder = {
            name: folderName,
            folders: [],
            bookmarks: [],
            totalBookmarks: 0,
            totalFolders: 0,
          }
          currentFolder.folders.push(newFolder)

          const nextSibling = children[i + 1]
          if (nextSibling && nextSibling.tagName === "DL") {
            processNode(nextSibling, newFolder)
          }
        }
      } else if (child.tagName === "DL") {
        processNode(child, currentFolder)
      }
    }
  }

  const mainDL = doc.querySelector("dl")
  if (mainDL) {
    processNode(mainDL, root)
  } else {
    throw new Error("Invalid HTML bookmark file format")
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
