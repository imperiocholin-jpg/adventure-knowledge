import chapterIndex from "@/data/imported-books/first-batch-chapters-index.json"

interface ChapterIndexBook {
  id: string
  chapterCount?: number
}

interface ChapterIndex {
  books?: ChapterIndexBook[]
}

const books = (chapterIndex as ChapterIndex).books ?? []

/** Books with extracted chapter files and readable content. */
export const CONTENT_AVAILABLE_IDS = books
  .filter((book) => book.id && (book.chapterCount ?? 0) > 0)
  .map((book) => book.id)
