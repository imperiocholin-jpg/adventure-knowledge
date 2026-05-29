import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"

import {
  buildBookCoverFilesystemCandidates,
  resolveBookCoverPublicUrl,
  resolveBookCoverEmoji,
} from "@/lib/library/book-cover"
import {
  LOCAL_BOOKS,
  isLocalBookContentAvailable,
  resolveLocalBookGradeLabel,
  resolveRegionNameForLocalBook,
} from "@/lib/library/local-book-catalog"

export interface AdminLocalBookItem {
  id: string
  title: string
  author: string
  cover: string
  coverImageSrc: string | null
  grade: number | null
  regionId: string
  regionName: string
  gradeBand: string
  gradeLabel: string
  chapterCount: number
  contentAvailable: boolean
  relativePath: string
}

export interface AdminLocalBookFilters {
  title?: string
  grade?: string
  regionId?: string
  chapterCount?: string
  status?: string
}

let chapterCountCache: Map<string, number> | null = null
let coverSrcCache: Map<string, string | null> | null = null

async function resolveCoverImageSrc(bookId: string, title: string) {
  const cacheKey = `${bookId}\0${title}`
  if (!coverSrcCache) coverSrcCache = new Map()
  if (coverSrcCache.has(cacheKey)) return coverSrcCache.get(cacheKey) ?? null

  let resolved: string | null = null
  for (const filePath of buildBookCoverFilesystemCandidates(bookId, title)) {
    try {
      await access(filePath)
      resolved = resolveBookCoverPublicUrl(path.basename(filePath))
      break
    } catch {
      // try next extension
    }
  }
  coverSrcCache.set(cacheKey, resolved)
  return resolved
}

async function loadChapterCountMap() {
  if (chapterCountCache) return chapterCountCache

  const dir = path.join(process.cwd(), "data", "imported-books", "chapters")
  const map = new Map<string, number>()

  try {
    const files = await readdir(dir)
    await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const bookId = file.replace(/\.json$/i, "")
          try {
            const raw = await readFile(path.join(dir, file), "utf8")
            const data = JSON.parse(raw) as { chapters?: unknown[] }
            map.set(bookId, Array.isArray(data.chapters) ? data.chapters.length : 0)
          } catch {
            map.set(bookId, 0)
          }
        }),
    )
  } catch {
    // 章节目录不存在时全部视为 0 章
  }

  chapterCountCache = map
  return map
}

export async function listAdminLocalBooks(options?: {
  q?: string
  filters?: AdminLocalBookFilters
  page?: number
  pageSize?: number
}): Promise<{ items: AdminLocalBookItem[]; total: number; page: number; pageSize: number }> {
  const legacyQ = options?.q?.trim().toLowerCase() ?? ""
  const filters = options?.filters ?? {}
  const titleQ = filters.title?.trim().toLowerCase() ?? legacyQ
  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 30))

  const chapterMap = await loadChapterCountMap()

  let items: AdminLocalBookItem[] = []
  for (const book of LOCAL_BOOKS) {
    const coverImageSrc = await resolveCoverImageSrc(book.id, book.title)
    items.push({
      id: book.id,
      title: book.title,
      author: book.author || "—",
      cover: resolveBookCoverEmoji(book.primaryRegionId),
      coverImageSrc,
      grade: book.grade,
      regionId: book.primaryRegionId,
      regionName: resolveRegionNameForLocalBook(book),
      gradeBand: book.gradeBand,
      gradeLabel: resolveLocalBookGradeLabel(book),
      chapterCount: chapterMap.get(book.id) ?? 0,
      contentAvailable: isLocalBookContentAvailable(book.id),
      relativePath: book.relativePath,
    })
  }

  if (titleQ) {
    items = items.filter((book) => book.title.toLowerCase().includes(titleQ))
  }

  if (filters.grade) {
    const grade = Number(filters.grade)
    if (Number.isFinite(grade)) {
      items = items.filter((book) => book.grade === grade)
    }
  }

  if (filters.regionId) {
    items = items.filter((book) => book.regionId === filters.regionId)
  }

  if (filters.chapterCount === "0") {
    items = items.filter((book) => book.chapterCount === 0)
  } else if (filters.chapterCount === "gt0") {
    items = items.filter((book) => book.chapterCount > 0)
  }

  if (filters.status === "available") {
    items = items.filter((book) => book.contentAvailable)
  } else if (filters.status === "pending") {
    items = items.filter((book) => !book.contentAvailable)
  }

  const total = items.length
  const from = (page - 1) * pageSize
  const paged = items.slice(from, from + pageSize)

  return { items: paged, total, page, pageSize }
}

export function invalidateAdminChapterCountCache() {
  chapterCountCache = null
  coverSrcCache = null
}
