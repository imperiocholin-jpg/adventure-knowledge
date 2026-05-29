import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

const appRoot = process.cwd()
const probePath = path.resolve(appRoot, "data", "pdf-text-probe.json")
const manifestPath = path.resolve(appRoot, "data", "local-book-manifest.json")
const outputDir = path.resolve(appRoot, "data", "imported-books", "raw-text")
const indexPath = path.resolve(appRoot, "data", "imported-books", "first-batch-index.json")
const maxPages = Number(process.argv[2] ?? 80)

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function runPythonExtract(pdfPath, engine) {
  const code = String.raw`
import json
import sys
from pypdf import PdfReader
import fitz

path = sys.argv[1]
engine = sys.argv[2]
result = {"ok": False, "sourcePageCount": 0, "pages": [], "error": None}

try:
    if engine == "fitz":
        doc = fitz.open(path)
        result["sourcePageCount"] = doc.page_count
        max_pages = int(sys.argv[3])
        page_count = doc.page_count if max_pages <= 0 else min(doc.page_count, max_pages)
        for index in range(page_count):
            text = doc.load_page(index).get_text("text") or ""
            result["pages"].append({"page": index + 1, "text": text})
        doc.close()
    else:
        reader = PdfReader(path)
        result["sourcePageCount"] = len(reader.pages)
        max_pages = int(sys.argv[3])
        pages = reader.pages if max_pages <= 0 else reader.pages[:max_pages]
        for index, page in enumerate(pages):
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            result["pages"].append({"page": index + 1, "text": text})
    result["ok"] = True
except Exception as exc:
    result["error"] = str(exc)

print(json.dumps(result, ensure_ascii=False))
`

  const child = spawnSync("python", ["-c", code, pdfPath, engine, String(maxPages)], {
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 1024 * 1024 * 200,
  })

  if (child.error) return { ok: false, error: child.error.message }
  if (child.status !== 0) return { ok: false, error: child.stderr || `Python exited with ${child.status}` }
  return JSON.parse(child.stdout)
}

function cleanText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const probe = JSON.parse(await readFile(probePath, "utf8"))
const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
const bookById = new Map(manifest.books.map((book) => [book.id, book]))
const rows = []

await mkdir(outputDir, { recursive: true })

for (const row of probe.results) {
  const engine = row.probe.bestEngine ?? "pypdf"
  const manifestBook = bookById.get(row.id)
  const pdfPath = manifestBook?.absolutePath
  if (!pdfPath) {
    rows.push({
      id: row.id,
      title: row.title,
      ok: false,
      error: "Missing source PDF path in local-book-manifest.json.",
    })
    continue
  }

  const actualExtracted = runPythonExtract(pdfPath, engine)

  if (!actualExtracted.ok) {
    rows.push({
      id: row.id,
      title: row.title,
      ok: false,
      error: actualExtracted.error,
    })
    continue
  }

  const pages = actualExtracted.pages.map((page) => ({
    page: page.page,
    text: cleanText(page.text ?? ""),
  }))
  const fullText = cleanText(pages.map((page) => page.text).join("\n\n"))
  const outputFileName = `${slugify(row.id)}.json`
  const outputPath = path.join(outputDir, outputFileName)

    const payload = {
    id: row.id,
    title: row.title,
    grade: row.grade,
    term: row.term,
    readingType: row.readingType,
    primaryRegionId: row.primaryRegionId,
    relativePath: row.relativePath,
    engine,
    sourcePageCount: actualExtracted.sourcePageCount,
    extractedPageCount: pages.length,
    textChars: fullText.length,
    pages,
  }

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  rows.push({
    id: row.id,
    title: row.title,
    ok: true,
    engine,
    sourcePageCount: actualExtracted.sourcePageCount,
    extractedPageCount: pages.length,
    textChars: fullText.length,
    rawTextPath: path.relative(appRoot, outputPath).split(path.sep).join("/"),
  })
}

await writeFile(
  indexPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: rows.length,
      books: rows,
    },
    null,
    2,
  )}\n`,
  "utf8",
)

console.log(`Wrote raw text for ${rows.filter((row) => row.ok).length}/${rows.length} books`)
console.log(`Max pages per book: ${maxPages <= 0 ? "all" : maxPages}`)
console.log(`Index: ${indexPath}`)
