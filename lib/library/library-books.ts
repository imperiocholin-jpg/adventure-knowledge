import type { AdventureRegionId } from "@/lib/library/adventure-regions"

import type { GradeBand, MoeCatalogEntry } from "@/lib/library/moe-catalog-2020"

import {
  getLocalBookStats,
  getLocalBooksByRegion,
  isLocalBookContentAvailable,
  LOCAL_BOOKS,
  resolveLocalBookGradeLabel,
  resolveRegionNameForLocalBook,
  type LocalBookEntry,
} from "@/lib/library/local-book-catalog"
import { resolveBookCoverEmoji } from "@/lib/library/book-cover"
import { READER_BOOKS, getReaderBookById, type ReaderBook } from "@/lib/library/book-catalog"

export interface LibraryDisplayBook {
  id: string
  moeId: string
  catalogSeq: number
  title: string
  author: string
  cover: string
  coverImageSrc: string | null
  grade: number | null
  gradeBand: GradeBand
  gradeBandLabel: string
  term: string | null
  readingType: string | null
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



function localBookToDisplay(book: LocalBookEntry, index: number): LibraryDisplayBook {

  const legacyReader = getReaderBookById(book.id)

  const contentAvailable = isLocalBookContentAvailable(book.id) || Boolean(legacyReader)



  return {

    id: book.id,

    moeId: book.id,

    catalogSeq: index + 1,

    title: book.title,

    author: book.author || legacyReader?.author || "",

    cover: legacyReader?.cover ?? resolveBookCoverEmoji(book.primaryRegionId),
    coverImageSrc: null,

    grade: book.grade,

    gradeBand: book.gradeBand,

    gradeBandLabel: resolveLocalBookGradeLabel(book),

    term: book.term,

    readingType: book.readingType,

    category: legacyReader?.category ?? "literature",

    categoryLabel: book.readingType ?? "推荐书目",

    primaryRegionId: book.primaryRegionId,

    regionName: resolveRegionNameForLocalBook(book),

    contentAvailable,

    contentPhase: contentAvailable ? "p1" : "p2",

    challengeChapterId: legacyReader?.challengeChapterId ?? `chapter_${book.id}`,

    chapters: legacyReader?.chapters,

  }

}



/** 书架展示：book 目录全部 PDF（189 本） */

export function buildLibraryDisplayBooks(options?: {

  gradeBand?: GradeBand | ""

  regionId?: AdventureRegionId | ""

  query?: string

}): LibraryDisplayBook[] {

  const gradeBand = options?.gradeBand ?? ""

  const regionId = options?.regionId ?? ""

  const query = options?.query?.trim().toLowerCase() ?? ""



  let list = LOCAL_BOOKS.map(localBookToDisplay)



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

        book.regionName.includes(query) ||

        (book.gradeBandLabel && book.gradeBandLabel.includes(query)),

    )

  }



  return list.sort((a, b) => {

    if (a.contentAvailable !== b.contentAvailable) return a.contentAvailable ? -1 : 1

    if ((a.grade ?? 0) !== (b.grade ?? 0)) return (a.grade ?? 0) - (b.grade ?? 0)

    if ((a.term ?? "") !== (b.term ?? "")) return String(a.term ?? "").localeCompare(String(b.term ?? ""), "zh-Hans-CN")

    return a.title.localeCompare(b.title, "zh-Hans-CN")

  })

}



export function buildRegionAdventureBooks(regionId: AdventureRegionId): RegionAdventureBook[] {

  return getLocalBooksByRegion(regionId).map((book, index) => {

    const display = localBookToDisplay(book, index)

    const reader = getReaderBookById(book.id)

    return {

      bookId: display.id,

      moeId: book.id,

      challengeChapterId: display.challengeChapterId ?? `chapter_${book.id}`,

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

  const stats = getLocalBookStats()

  return {

    total: stats.total,

    available: stats.available,

    byRegion: stats.byRegion,

  }

}



export { GRADE_BAND_LABEL } from "@/lib/library/moe-catalog-2020"


