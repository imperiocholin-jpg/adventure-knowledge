import path from "node:path"

import {
  BOOK_COVER_EXTENSIONS,
  buildBookCoverFileName,
  buildBookCoverFileNameByTitle,
} from "@/lib/library/book-cover"

function uniqueStrings(values: string[]) {
  return [...new Set(values)]
}

/** 磁盘上的封面文件候选路径（服务端检测用） */
export function buildBookCoverFilesystemCandidates(bookId: string, title?: string, cwd = process.cwd()) {
  const dir = path.join(cwd, "public", "image", "book-covers")
  const paths: string[] = []
  const trimmedTitle = title?.trim()

  if (trimmedTitle) {
    for (const ext of BOOK_COVER_EXTENSIONS) {
      paths.push(path.join(dir, buildBookCoverFileNameByTitle(trimmedTitle, ext)))
    }
  }

  for (const ext of BOOK_COVER_EXTENSIONS) {
    paths.push(path.join(dir, buildBookCoverFileName(bookId, ext)))
  }

  return uniqueStrings(paths)
}
