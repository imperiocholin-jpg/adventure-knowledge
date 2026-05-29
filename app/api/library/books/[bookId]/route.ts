import { readFile } from "node:fs/promises"
import path from "node:path"

import { NextRequest, NextResponse } from "next/server"

import { getReaderBookById } from "@/lib/library/book-catalog"
import { normalizeBookId } from "@/lib/library/book-id-route"
import { getLocalBookById } from "@/lib/library/local-book-catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ChapterFile {
  id: string
  title: string
  author?: string
  primaryRegionId?: string
  chapters: Array<{ title?: string; text: string }>
}

async function loadImportedChapters(bookId: string) {
  const filePath = path.join(process.cwd(), "data", "imported-books", "chapters", `${bookId}.json`)
  const raw = await readFile(filePath, "utf8")
  const data = JSON.parse(raw) as ChapterFile
  if (!Array.isArray(data.chapters) || data.chapters.length === 0) return null

  return {
    id: data.id,
    title: data.title,
    author: "",
    cover: "📖",
    primaryRegionId: data.primaryRegionId ?? null,
    chapters: data.chapters.map((chapter) => chapter.text),
    chapterTitles: data.chapters.map((chapter, index) => chapter.title ?? `第${index + 1}章`),
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId: rawBookId } = await context.params
    const bookId = normalizeBookId(rawBookId ?? "")
    if (!bookId) {
      return NextResponse.json({ ok: false, error: { message: "缺少书籍 ID" } }, { status: 400 })
    }

    const localMeta = getLocalBookById(bookId)
    const legacy = getReaderBookById(bookId)

    if (legacy) {
      return NextResponse.json({
        ok: true,
        data: {
          id: legacy.id,
          title: legacy.title,
          author: legacy.author,
          cover: legacy.cover,
          primaryRegionId: legacy.primaryRegionId ?? localMeta?.primaryRegionId ?? null,
          chapters: legacy.chapters,
          chapterTitles: legacy.chapters.map((_, index) => `第${index + 1}章`),
          source: "legacy",
        },
      })
    }

    const imported = await loadImportedChapters(bookId).catch(() => null)
    if (imported) {
      return NextResponse.json({
        ok: true,
        data: {
          ...imported,
          author: localMeta?.author ?? imported.author,
          source: "imported",
        },
      })
    }

    if (localMeta) {
      return NextResponse.json(
        { ok: false, error: { message: "该书电子版尚未上线", contentAvailable: false } },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: false, error: { message: "未找到该书籍" } }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: { message: error instanceof Error ? error.message : "加载失败" } },
      { status: 500 },
    )
  }
}
