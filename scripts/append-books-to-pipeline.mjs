import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

const appRoot = process.cwd()
const manifestPath = path.resolve(appRoot, "data", "local-book-manifest.json")
const batchIndexPath = path.resolve(appRoot, "data", "imported-books", "first-batch-index.json")
const rawTextDir = path.resolve(appRoot, "data", "imported-books", "raw-text")
const maxPages = Number(process.argv[2] ?? 80)
const requestedTitles = process.argv.slice(3)
const targetTitles = requestedTitles.length > 0 ? requestedTitles : ["三国演义", "水浒传"]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function runPythonProbeAndExtract(pdfPath) {
  const code = String.raw`
import json
import sys
from pypdf import PdfReader
import fitz

path = sys.argv[1]
max_pages = int(sys.argv[2])

def metrics(text):
    normalized = " ".join((text or "").split())
    cjk = sum(1 for ch in normalized if "\u4e00" <= ch <= "\u9fff")
    replacement = normalized.count("\ufffd")
    return {
        "textChars": len(normalized),
        "cjkChars": cjk,
        "replacementChars": replacement,
        "qualityScore": cjk - replacement * 5 + min(len(normalized), 4000) // 20,
        "sampleText": normalized[:500],
    }

def extract_pypdf(limit):
    reader = PdfReader(path)
    pages = reader.pages if limit <= 0 else reader.pages[:limit]
    extracted = []
    for index, page in enumerate(pages):
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        extracted.append({"page": index + 1, "text": text})
    return {"engine": "pypdf", "sourcePageCount": len(reader.pages), "pages": extracted}

def extract_fitz(limit):
    doc = fitz.open(path)
    page_count = doc.page_count if limit <= 0 else min(doc.page_count, limit)
    extracted = []
    for index in range(page_count):
        extracted.append({"page": index + 1, "text": doc.load_page(index).get_text("text") or ""})
    source_page_count = doc.page_count
    doc.close()
    return {"engine": "fitz", "sourcePageCount": source_page_count, "pages": extracted}

results = []
for extractor in (extract_pypdf, extract_fitz):
    try:
        extracted = extractor(max_pages)
        sample = "\n".join(page["text"] for page in extracted["pages"][:12])
        extracted["probe"] = {"ok": True, "pageCount": extracted["sourcePageCount"], **metrics(sample)}
        results.append(extracted)
    except Exception as exc:
        results.append({"engine": extractor.__name__.replace("extract_", ""), "probe": {"ok": False, "error": str(exc), "qualityScore": -999999}})

best = max(results, key=lambda item: item.get("probe", {}).get("qualityScore", -999999))
print(json.dumps(best, ensure_ascii=False))
`

  const child = spawnSync("python", ["-c", code, pdfPath, String(maxPages)], {
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 1024 * 1024 * 200,
  })

  if (child.error) throw child.error
  if (child.status !== 0) throw new Error(child.stderr || `Python exited with ${child.status}`)
  const result = JSON.parse(child.stdout)
  if (!result.probe?.ok) throw new Error(result.probe?.error ?? "PDF extraction failed")
  return result
}

function normalizeRegion(book) {
  if (book.title === "三国演义" || book.title === "水浒传") return "ancient-desert"
  return book.primaryRegionId
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
const batchIndex = JSON.parse(await readFile(batchIndexPath, "utf8"))
const existing = new Set(batchIndex.books.map((book) => book.id))

await mkdir(rawTextDir, { recursive: true })

const appended = []
for (const title of targetTitles) {
  const book = manifest.books.find((item) => item.title === title)
  if (!book) throw new Error(`Book not found in local manifest: ${title}`)
  if (existing.has(book.id)) {
    console.log(`Skipped existing book: ${title}`)
    continue
  }

  const extracted = runPythonProbeAndExtract(book.absolutePath)
  const pages = extracted.pages.map((page) => ({
    page: page.page,
    text: cleanText(page.text ?? ""),
  }))
  const fullText = cleanText(pages.map((page) => page.text).join("\n\n"))
  const outputPath = path.join(rawTextDir, `${slugify(book.id)}.json`)
  const primaryRegionId = normalizeRegion(book)

  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        id: book.id,
        title: book.title,
        grade: book.grade,
        term: book.term,
        readingType: book.readingType,
        primaryRegionId,
        relativePath: book.relativePath,
        engine: extracted.engine,
        sourcePageCount: extracted.sourcePageCount,
        extractedPageCount: pages.length,
        textChars: fullText.length,
        pages,
      },
      null,
      2,
    )}\n`,
    "utf8",
  )

  appended.push({
    id: book.id,
    title: book.title,
    ok: true,
    engine: extracted.engine,
    sourcePageCount: extracted.sourcePageCount,
    extractedPageCount: pages.length,
    textChars: fullText.length,
    rawTextPath: path.relative(appRoot, outputPath).split(path.sep).join("/"),
  })
}

if (appended.length > 0) {
  batchIndex.generatedAt = new Date().toISOString()
  batchIndex.books.push(...appended)
  batchIndex.total = batchIndex.books.length
  await writeFile(batchIndexPath, `${JSON.stringify(batchIndex, null, 2)}\n`, "utf8")
}

console.log(
  JSON.stringify(
    {
      ok: true,
      appended: appended.map((book) => ({
        title: book.title,
        sourcePageCount: book.sourcePageCount,
        extractedPageCount: book.extractedPageCount,
        textChars: book.textChars,
      })),
      totalBooks: batchIndex.books.length,
    },
    null,
    2,
  ),
)
