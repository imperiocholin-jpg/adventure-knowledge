import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { getAdventureRegionName } from "@/lib/library/adventure-regions"
import {
  GRADE_BAND_LABEL,
  MOE_CATEGORY_LABEL,
  type GradeBand,
  type MoeCatalogEntry,
  getMoeCatalogByGradeBand,
  getMoeCatalogByRegion,
  isCatalogContentAvailable,
  MOE_CATALOG_2020,
} from "@/lib/library/moe-catalog-2020"
import { READER_BOOKS, getReaderBookById, type ReaderBook } from "@/lib/library/book-catalog"

export interface LibraryDisplayBook {
  /** 阅读器路由用；无正文时为 moe-xxx */
  id: string
  moeId: string
  catalogSeq: number
  title: string
  author: string
  cover: string
  gradeBand: GradeBand
  gradeBandLabel: string
  category: MoeCatalogEntry["category"]
  categoryLabel: string
  primaryRegionId: AdventureRegionId
  regionName: string
  contentAvailable: boolean
  contentPhase: MoeCatalogEntry["contentPhase"]
  challengeChapterId?: string
  chapters?: string[]
}

export interface RegionAdventureBook {
  bookId: string
  moeId: string
  challengeChapterId: string
  title: string
  author: string
  cover: string
  gradeBand: GradeBand
  book: ReaderBook | LibraryDisplayBook
  contentAvailable: boolean
}

function mergeCatalogWithReader(entry: MoeCatalogEntry): LibraryDisplayBook {
  const reader = entry.legacyReaderBookId ? getReaderBookById(entry.legacyReaderBookId) : null
  const contentAvailable = Boolean(reader) || isCatalogContentAvailable(entry)
  return {
    id: reader?.id ?? entry.id,
    moeId: entry.id,
    catalogSeq: entry.catalogSeq,
    title: entry.title,
    author: entry.author,
    cover: reader?.cover ?? entry.coverEmoji,
    gradeBand: entry.gradeBand,
    gradeBandLabel: GRADE_BAND_LABEL[entry.gradeBand],
    category: entry.category,
    categoryLabel: MOE_CATEGORY_LABEL[entry.category],
    primaryRegionId: entry.primaryRegionId,
    regionName: getAdventureRegionName(entry.primaryRegionId),
    contentAvailable,
    contentPhase: entry.contentPhase,
    challengeChapterId: entry.challengeChapterId ?? reader?.challengeChapterId,
    chapters: reader?.chapters,
  }
}

/** 书架展示：110 种目录 + 演示扩展书 */
export function buildLibraryDisplayBooks(options?: {
  gradeBand?: GradeBand | ""
  regionId?: AdventureRegionId | ""
  query?: string
}): LibraryDisplayBook[] {
  const gradeBand = options?.gradeBand ?? ""
  const regionId = options?.regionId ?? ""
  const query = options?.query?.trim().toLowerCase() ?? ""

  let list = MOE_CATALOG_2020.map(mergeCatalogWithReader)

  const bonusReaders = READER_BOOKS.filter((book) => !book.moeId)
  for (const reader of bonusReaders) {
    list.push({
      id: reader.id,
      moeId: reader.id,
      catalogSeq: reader.catalogSeq ?? 0,
      title: reader.title,
      author: reader.author,
      cover: reader.cover,
      gradeBand: reader.gradeBand ?? "3-4",
      gradeBandLabel: GRADE_BAND_LABEL[reader.gradeBand ?? "3-4"],
      category: reader.category ?? "literature",
      categoryLabel: MOE_CATEGORY_LABEL[reader.category ?? "literature"],
      primaryRegionId: reader.primaryRegionId ?? "sky-kingdom",
      regionName: getAdventureRegionName(reader.primaryRegionId ?? "sky-kingdom"),
      contentAvailable: true,
      contentPhase: "p1",
      challengeChapterId: reader.challengeChapterId,
      chapters: reader.chapters,
    })
  }

  if (gradeBand) {
    list = list.filter((book) => book.gradeBand === gradeBand)
  }
  if (regionId) {
    list = list.filter((book) => book.primaryRegionId === regionId)
  }
  if (query) {
    list = list.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.regionName.includes(query),
    )
  }

  return list.sort((a, b) => {
    if (a.contentAvailable !== b.contentAvailable) return a.contentAvailable ? -1 : 1
    return a.catalogSeq - b.catalogSeq
  })
}

export function buildRegionAdventureBooks(regionId: AdventureRegionId): RegionAdventureBook[] {
  return getMoeCatalogByRegion(regionId).map((entry) => {
    const display = mergeCatalogWithReader(entry)
    const reader = entry.legacyReaderBookId ? getReaderBookById(entry.legacyReaderBookId) : null
    return {
      bookId: display.id,
      moeId: entry.id,
      challengeChapterId: entry.challengeChapterId ?? `chapter_${entry.catalogSeq}`,
      title: display.title,
      author: display.author,
      cover: display.cover,
      gradeBand: display.gradeBand,
      book: reader ?? display,
      contentAvailable: display.contentAvailable,
    }
  })
}

export function getCatalogStats() {
  const byRegion = Object.fromEntries(
    (["magic-forest", "ice-mountain", "ancient-desert", "ocean-ruins", "sky-kingdom", "dream-tower"] as const).map(
      (id) => [id, getMoeCatalogByRegion(id).length],
    ),
  ) as Record<AdventureRegionId, number>
  const moeAvailable = MOE_CATALOG_2020.filter(isCatalogContentAvailable).length
  const bonusAvailable = READER_BOOKS.filter((book) => !book.moeId).length
  return {
    total: MOE_CATALOG_2020.length,
    available: moeAvailable + bonusAvailable,
    byRegion,
  }
}

export { getMoeCatalogByGradeBand, GRADE_BAND_LABEL }
