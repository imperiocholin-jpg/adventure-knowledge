import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const batchIndexPath = path.resolve(appRoot, "data", "imported-books", "first-batch-index.json")
const outputDir = path.resolve(appRoot, "data", "imported-books", "chapters")
const outputIndexPath = path.resolve(appRoot, "data", "imported-books", "first-batch-chapters-index.json")

const maxChaptersPerBook = Number(process.argv[2] ?? 3)
const minChapterChars = Number(process.argv[3] ?? 1200)
const fallbackChunkChars = Number(process.argv[4] ?? 3200)
const maxSegmentChars = Number(process.argv[5] ?? 4500)

const SKIP_HEADING_KEYWORDS = [
  "目录",
  "版权",
  "图书在版",
  "作者介绍",
  "译序",
  "序：",
  "珍藏相册",
  "关注",
  "公众号",
  "ISBN",
]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function cleanBoilerplate(value) {
  const lines = normalizeText(value).split("\n")
  const cleaned = lines.filter((line) => {
    const text = line.trim()
    if (!text) return true
    if (text.includes("更多免费资料，请关注公众号")) return false
    if (text.includes("统编版小学语文教师")) return false
    if (text.includes("仅供学习与交流")) return false
    if (text.includes("禁止用于商业用途")) return false
    return true
  })
  return normalizeText(cleaned.join("\n"))
}

function isLikelyHeading(line) {
  const text = line.trim()
  if (!text || text.length > 36) return false
  if (SKIP_HEADING_KEYWORDS.some((keyword) => text.includes(keyword))) return false
  if (/^第[一二三四五六七八九十百千万\d]+[章节回卷部篇集]\s*.*$/.test(text)) return true
  if (/^\d{1,2}[\.、]\s*\S.{0,28}$/.test(text)) return true
  if (/^[一二三四五六七八九十]{1,3}[、.]\s*\S.{0,28}$/.test(text)) return true
  return false
}

function mergeAdjacentHeading(lines, index) {
  const current = lines[index]?.trim() ?? ""
  const next = lines[index + 1]?.trim() ?? ""
  if (/^第[一二三四五六七八九十百千万\d]+[章节回卷部篇集]$/.test(current) && next && next.length <= 24) {
    return `${current} ${next}`
  }
  return current
}

function findHeadingPositions(lines) {
  const positions = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? ""
    if (!isLikelyHeading(line)) continue
    const before = lines.slice(Math.max(0, index - 2), index).join("").trim()
    const after = lines.slice(index + 1, Math.min(lines.length, index + 6)).join("").trim()
    if (after.length < 80 && before.length < 80) continue
    positions.push({
      index,
      title: mergeAdjacentHeading(lines, index),
    })
  }
  return positions
}

function pageForLine(linePageBreaks, lineIndex) {
  let page = 1
  for (const marker of linePageBreaks) {
    if (lineIndex >= marker.lineIndex) page = marker.page
    else break
  }
  return page
}

function splitByHeadings(rawPages, book) {
  const linePageBreaks = []
  const pageLines = []
  for (const page of rawPages) {
    linePageBreaks.push({ lineIndex: pageLines.length, page: page.page })
    pageLines.push(...cleanBoilerplate(page.text ?? "").split("\n"))
  }

  const lines = pageLines.map((line) => line.trim()).filter(Boolean)
  const headings = findHeadingPositions(lines)
  const chapters = []

  for (let h = 0; h < headings.length && chapters.length < maxChaptersPerBook; h += 1) {
    const current = headings[h]
    const next = headings[h + 1]
    const contentLines = lines.slice(current.index + 1, next?.index ?? lines.length)
    const text = cleanBoilerplate(contentLines.join("\n"))
    if (text.length < minChapterChars) continue
    chapters.push({
      chapterNo: chapters.length + 1,
      title: current.title,
      sourceStartPage: pageForLine(linePageBreaks, current.index),
      text,
      splitMethod: "heading",
    })
  }

  return chapters
}

function splitByChunks(rawPages, book) {
  const allText = cleanBoilerplate(rawPages.map((page) => page.text ?? "").join("\n\n"))
  const paragraphs = allText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length >= 20)
    .filter((paragraph) => !SKIP_HEADING_KEYWORDS.some((keyword) => paragraph.includes(keyword)))

  const chunks = []
  let buffer = ""
  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length > fallbackChunkChars && buffer.length >= minChapterChars) {
      chunks.push(buffer.trim())
      buffer = ""
      if (chunks.length >= maxChaptersPerBook) break
    }
    buffer += `${paragraph}\n\n`
  }
  if (chunks.length < maxChaptersPerBook && buffer.trim().length >= minChapterChars) {
    chunks.push(buffer.trim())
  }

  return chunks.slice(0, maxChaptersPerBook).map((text, index) => ({
    chapterNo: index + 1,
    title: `${book.title} 片段 ${index + 1}`,
    sourceStartPage: null,
    text,
    splitMethod: "chunk",
  }))
}

function splitTextIntoSegments(text, targetChars = fallbackChunkChars) {
  let paragraphs = cleanBoilerplate(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length < 3) {
    paragraphs = cleanBoilerplate(text)
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }

  const segments = []
  let buffer = ""
  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length > targetChars && buffer.length >= minChapterChars) {
      segments.push(buffer.trim())
      buffer = ""
    }
    buffer += `${paragraph}\n\n`
  }
  if (buffer.trim().length >= minChapterChars) segments.push(buffer.trim())

  if (segments.length === 0 && text.trim().length > 0) {
    for (let index = 0; index < text.length; index += targetChars) {
      const segment = text.slice(index, index + targetChars).trim()
      if (segment.length >= minChapterChars) segments.push(segment)
    }
  }

  return segments
}

function expandLongHeadingChapters(chapters) {
  const expanded = []
  for (const chapter of chapters) {
    if (chapter.text.length <= maxSegmentChars) {
      expanded.push(chapter)
      continue
    }

    const segments = splitTextIntoSegments(chapter.text, fallbackChunkChars)
    if (segments.length <= 1) {
      expanded.push(chapter)
      continue
    }

    segments.forEach((text, index) => {
      expanded.push({
        ...chapter,
        title: `${chapter.title}（${index + 1}）`,
        text,
        splitMethod: "heading-segment",
      })
    })
  }

  return expanded.map((chapter, index) => ({
    ...chapter,
    chapterNo: index + 1,
  }))
}

function buildChapterSummary(text) {
  const compact = text.replace(/\s+/g, "")
  return compact.slice(0, 120)
}

function buildChapterPayload(book, rawBook) {
  let chapters = expandLongHeadingChapters(splitByHeadings(rawBook.pages, book))
  if (chapters.length < maxChaptersPerBook) {
    const fallback = splitByChunks(rawBook.pages, book)
    const existingText = new Set(chapters.map((chapter) => chapter.text.slice(0, 200)))
    for (const chapter of fallback) {
      if (chapters.length >= maxChaptersPerBook) break
      if (existingText.has(chapter.text.slice(0, 200))) continue
      chapters.push({
        ...chapter,
        chapterNo: chapters.length + 1,
      })
    }
  }

  return {
    id: book.id,
    title: book.title,
    grade: rawBook.grade,
    term: rawBook.term,
    readingType: rawBook.readingType,
    primaryRegionId: rawBook.primaryRegionId,
    sourceRawTextPath: book.rawTextPath,
    maxChaptersPerBook,
    chapters: chapters.slice(0, maxChaptersPerBook).map((chapter) => ({
      ...chapter,
      id: `${book.id}-chapter-${chapter.chapterNo}`,
      charCount: chapter.text.length,
      estimatedMinutes: Math.max(2, Math.ceil(chapter.text.length / 550)),
      summaryDraft: buildChapterSummary(chapter.text),
    })),
  }
}

const batchIndex = JSON.parse(await readFile(batchIndexPath, "utf8"))
await mkdir(outputDir, { recursive: true })

const rows = []
for (const book of batchIndex.books.filter((row) => row.ok)) {
  const rawPath = path.resolve(appRoot, book.rawTextPath)
  const rawBook = JSON.parse(await readFile(rawPath, "utf8"))
  const payload = buildChapterPayload(book, rawBook)
  const outputPath = path.join(outputDir, `${slugify(book.id)}.json`)
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  rows.push({
    id: book.id,
    title: book.title,
    chapterCount: payload.chapters.length,
    splitMethods: [...new Set(payload.chapters.map((chapter) => chapter.splitMethod))],
    outputPath: path.relative(appRoot, outputPath).split(path.sep).join("/"),
    chapters: payload.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      charCount: chapter.charCount,
      estimatedMinutes: chapter.estimatedMinutes,
      splitMethod: chapter.splitMethod,
    })),
  })
}

await writeFile(
  outputIndexPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      maxChaptersPerBook,
      totalBooks: rows.length,
      totalChapters: rows.reduce((sum, row) => sum + row.chapterCount, 0),
      books: rows,
    },
    null,
    2,
  )}\n`,
  "utf8",
)

console.log(`Wrote ${rows.reduce((sum, row) => sum + row.chapterCount, 0)} chapters for ${rows.length} books`)
console.log(`Index: ${outputIndexPath}`)
for (const row of rows) {
  console.log(`${String(row.chapterCount).padStart(2)} chapters ${row.title} [${row.splitMethods.join(", ")}]`)
}
