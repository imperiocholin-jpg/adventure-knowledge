import path from "node:path"

import type { AdventureRegionId } from "@/lib/library/adventure-regions"
import { resolveCoverEmoji } from "@/lib/library/grade-region-map"

/** 书封静态资源目录（相对项目根目录） */
export const BOOK_COVER_PUBLIC_DIR = "/image/book-covers"

/** 推荐格式：webp；也支持 png / jpg */
export const BOOK_COVER_EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const

export type BookCoverExtension = (typeof BOOK_COVER_EXTENSIONS)[number]

export interface BookCoverAsset {
  emoji: string
  imageSrc: string | null
  imageCandidates: string[]
}

export function buildBookCoverFileName(bookId: string, ext: BookCoverExtension) {
  return `${bookId}.${ext}`
}

export function buildBookCoverFileNameByTitle(title: string, ext: BookCoverExtension) {
  return `${title.trim()}.${ext}`
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)]
}

/** 浏览器可用的封面 URL 候选（按优先级：书名 → 书目 ID） */
export function buildBookCoverPublicCandidates(bookId: string, title?: string) {
  const urls: string[] = []
  const trimmedTitle = title?.trim()

  if (trimmedTitle) {
    for (const ext of BOOK_COVER_EXTENSIONS) {
      urls.push(
        `${BOOK_COVER_PUBLIC_DIR}/${encodeURIComponent(buildBookCoverFileNameByTitle(trimmedTitle, ext))}`,
      )
    }
  }

  for (const ext of BOOK_COVER_EXTENSIONS) {
    urls.push(`${BOOK_COVER_PUBLIC_DIR}/${encodeURIComponent(buildBookCoverFileName(bookId, ext))}`)
  }

  return uniqueStrings(urls)
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

export function resolveBookCoverPublicUrl(fileName: string) {
  return `${BOOK_COVER_PUBLIC_DIR}/${encodeURIComponent(fileName)}`
}

export function resolveBookCoverEmoji(regionId: AdventureRegionId) {
  return resolveCoverEmoji(regionId)
}

export function buildBookCoverAsset(bookId: string, regionId: AdventureRegionId, imageSrc: string | null): BookCoverAsset {
  return {
    emoji: resolveBookCoverEmoji(regionId),
    imageSrc,
    imageCandidates: buildBookCoverPublicCandidates(bookId),
  }
}
