import { mkdir, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const defaultBookRoot = path.resolve(appRoot, "..", "book")
const bookRoot = path.resolve(process.argv[2] ?? defaultBookRoot)
const outputPath = path.resolve(appRoot, "data", "local-book-manifest.json")

const CHINESE_NUMERAL_GRADE = new Map([
  ["一", 1],
  ["二", 2],
  ["三", 3],
  ["四", 4],
  ["五", 5],
  ["六", 6],
])

function toPosixPath(value) {
  return value.split(path.sep).join("/")
}

function parseGrade(raw) {
  const numeric = raw.match(/([1-6])年级/)
  if (numeric) return Number(numeric[1])

  const chinese = raw.match(/([一二三四五六])年级/)
  if (chinese) return CHINESE_NUMERAL_GRADE.get(chinese[1]) ?? null

  return null
}

function parseTermAndRequired(raw) {
  const term = raw.includes("上册") ? "上册" : raw.includes("下册") ? "下册" : null
  const readingType = raw.includes("必读") ? "必读" : raw.includes("选读") ? "选读" : null
  return { term, readingType }
}

function stripPdfExtension(fileName) {
  return fileName.replace(/\.pdf$/i, "")
}

function normalizeTitle(raw) {
  let value = stripPdfExtension(raw).trim()
  value = value.replace(/^《(.+)》$/, "$1")
  value = value.replace(/^《(.+?)》\s*/, "$1 ")
  value = value.replace(/\s+/g, " ").trim()
  return value
}

function parseTitleAndAuthor(fileName) {
  const base = normalizeTitle(fileName)
  const authorMatch = base.match(/^(.*?)\s*作者[-：:]\s*(.+)$/)
  if (!authorMatch) {
    return {
      title: base.trim(),
      author: "",
    }
  }
  return {
    title: authorMatch[1].trim(),
    author: authorMatch[2].trim(),
  }
}

const GRADE_TO_REGION = {
  1: "magic-forest",
  2: "ice-mountain",
  3: "ancient-desert",
  4: "ocean-ruins",
  5: "sky-kingdom",
  6: "dream-tower",
}

function resolveRegionByGrade(grade) {
  if (typeof grade === "number" && grade >= 1 && grade <= 6) {
    return GRADE_TO_REGION[grade]
  }
  return "magic-forest"
}

async function walk(dir, context = {}) {
  const entries = await readdir(dir, { withFileTypes: true })
  const books = []

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const grade = parseGrade(entry.name) ?? context.grade ?? null
      const termMeta = parseTermAndRequired(entry.name)
      books.push(
        ...(await walk(absolutePath, {
          grade,
          term: termMeta.term ?? context.term ?? null,
          readingType: termMeta.readingType ?? context.readingType ?? null,
          collection: grade || termMeta.term || termMeta.readingType ? null : entry.name,
        })),
      )
      continue
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".pdf")) continue

    const fileStat = await stat(absolutePath)
    const parsed = parseTitleAndAuthor(entry.name)
    const relativePath = path.relative(bookRoot, absolutePath)
    const idBase = stripPdfExtension(relativePath)
      .toLowerCase()
      .replace(/\\/g, "-")
      .replace(/\//g, "-")
      .replace(/\s+/g, "-")
      .replace(/[()（）《》]/g, "")

    books.push({
      id: `local-${idBase}`,
      title: parsed.title,
      author: parsed.author,
      grade: context.grade,
      gradeBand: context.grade <= 2 ? "1-2" : context.grade <= 4 ? "3-4" : "5-6",
      term: context.term,
      readingType: context.readingType,
      collection: context.collection ?? null,
      primaryRegionId: resolveRegionByGrade(context.grade),
      contentSource: "local-pdf",
      contentStatus: fileStat.size > 0 ? "pdf-indexed" : "file-empty",
      fileSize: fileStat.size,
      relativePath: toPosixPath(relativePath),
      absolutePath,
    })
  }

  return books
}

const rootStat = await stat(bookRoot).catch(() => null)
if (!rootStat?.isDirectory()) {
  throw new Error(`Book root does not exist or is not a directory: ${bookRoot}`)
}

const books = (await walk(bookRoot)).sort((a, b) => {
  if ((a.grade ?? 0) !== (b.grade ?? 0)) return (a.grade ?? 0) - (b.grade ?? 0)
  if ((a.term ?? "") !== (b.term ?? "")) return String(a.term ?? "").localeCompare(String(b.term ?? ""), "zh-Hans-CN")
  if ((a.readingType ?? "") !== (b.readingType ?? "")) {
    return String(a.readingType ?? "").localeCompare(String(b.readingType ?? ""), "zh-Hans-CN")
  }
  return a.title.localeCompare(b.title, "zh-Hans-CN")
})

const payload = {
  generatedAt: new Date().toISOString(),
  bookRoot,
  total: books.length,
  books,
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

const byGrade = new Map()
for (const book of books) {
  const key = book.grade ?? "unknown"
  byGrade.set(key, [...(byGrade.get(key) ?? []), book])
}
const emptyFiles = books.filter((book) => book.contentStatus === "file-empty")

console.log(`Wrote ${books.length} books to ${outputPath}`)
console.log(
  [...byGrade.entries()]
    .map(([grade, items]) => `${grade}年级: ${items.length}`)
    .join(" | "),
)
if (emptyFiles.length > 0) {
  console.warn(`Empty PDF files: ${emptyFiles.map((book) => book.relativePath).join(", ")}`)
}
