import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { getAdventureRegionName } from "@/lib/library/adventure-regions"
import {
  GRADE_LABEL,
  resolveCoverEmoji,
  resolveRegionByGrade,
} from "@/lib/library/grade-region-map"
import { GRADE_BAND_LABEL, type GradeBand } from "@/lib/library/moe-catalog-2020"
import manifestData from "@/data/local-book-manifest.json"
import { CONTENT_AVAILABLE_IDS } from "@/lib/library/content-available-ids"

export interface LocalBookEntry {
  id: string
  title: string
  author: string
  grade: number | null
  gradeBand: GradeBand
  term: string | null
  readingType: string | null
  collection: string | null
  primaryRegionId: AdventureRegionId
  relativePath: string
}

const CONTENT_AVAILABLE_SET = new Set<string>(CONTENT_AVAILABLE_IDS)

function normalizeManifestBook(raw: (typeof manifestData.books)[number]): LocalBookEntry {
  const grade = typeof raw.grade === "number" ? raw.grade : null
  const gradeBand = (raw.gradeBand ?? "1-2") as GradeBand
  const primaryRegionId = (raw.primaryRegionId ?? resolveRegionByGrade(grade)) as AdventureRegionId

  return {
    id: raw.id,
    title: raw.title,
    author: raw.author ?? "",
    grade,
    gradeBand,
    term: raw.term ?? null,
    readingType: raw.readingType ?? null,
    collection: raw.collection ?? null,
    primaryRegionId,
    relativePath: raw.relativePath,
  }
}

export const LOCAL_BOOKS: LocalBookEntry[] = manifestData.books.map(normalizeManifestBook)

export function isLocalBookContentAvailable(bookId: string) {
  return CONTENT_AVAILABLE_SET.has(bookId)
}

export function getLocalBookById(bookId: string) {
  return LOCAL_BOOKS.find((book) => book.id === bookId) ?? null
}

export function getLocalBooksByRegion(regionId: AdventureRegionId) {
  return LOCAL_BOOKS.filter((book) => book.primaryRegionId === regionId)
}

export function getLocalBooksByGradeBand(gradeBand: GradeBand | "") {
  if (!gradeBand) return LOCAL_BOOKS
  return LOCAL_BOOKS.filter((book) => book.gradeBand === gradeBand)
}

export function resolveLocalBookCover(book: LocalBookEntry) {
  return resolveCoverEmoji(book.primaryRegionId)
}

export function resolveLocalBookGradeLabel(book: LocalBookEntry) {
  if (book.grade && GRADE_LABEL[book.grade]) {
    const parts = [GRADE_LABEL[book.grade]]
    if (book.term) parts.push(book.term)
    if (book.readingType) parts.push(book.readingType)
    return parts.join(" · ")
  }
  return GRADE_BAND_LABEL[book.gradeBand]
}

export function getLocalBookStats() {
  const byRegion = Object.fromEntries(
    (["magic-forest", "ice-mountain", "ancient-desert", "ocean-ruins", "sky-kingdom", "dream-tower"] as const).map(
      (id) => [id, getLocalBooksByRegion(id).length],
    ),
  ) as Record<AdventureRegionId, number>

  return {
    total: LOCAL_BOOKS.length,
    available: LOCAL_BOOKS.filter((book) => isLocalBookContentAvailable(book.id)).length,
    byRegion,
  }
}

export function resolveRegionNameForLocalBook(book: LocalBookEntry) {
  return getAdventureRegionName(book.primaryRegionId)
}
