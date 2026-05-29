import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { spawnSync } from "node:child_process"

const appRoot = process.cwd()
const manifestPath = path.resolve(appRoot, "data", "local-book-manifest.json")
const outputPath = path.resolve(appRoot, "data", "pdf-text-probe.json")

const FIRST_BATCH_TITLES = [
  "365夜故事",
  "小巴掌童话",
  "没头脑和不高兴",
  "安徒生童话",
  "绿野仙踪",
  "木偶奇遇记",
  "格林童话",
  "狐狸列那的故事",
  "爱丽丝漫游奇境",
  "时代广场的蟋蟀",
  "夏洛的网",
  "海底两万里",
  "草房子",
  "昆虫记",
  "小王子",
  "西游记",
  "汤姆-索亚历险记",
  "鲁滨逊漂流记",
  "格列佛游记",
  "老人与海",
]

function runPythonProbe(pdfPath) {
  const code = String.raw`
import json
import sys
from pypdf import PdfReader
import fitz

path = sys.argv[1]
result = {"engines": {}, "bestEngine": None}

def metrics(text):
    normalized = " ".join((text or "").split())
    cjk = sum(1 for ch in normalized if "\u4e00" <= ch <= "\u9fff")
    replacement = normalized.count("\ufffd") + normalized.count("�")
    ascii_letters = sum(1 for ch in normalized if ("a" <= ch.lower() <= "z"))
    return {
        "textChars": len(normalized),
        "cjkChars": cjk,
        "replacementChars": replacement,
        "asciiLetters": ascii_letters,
        "sampleText": normalized[:500],
        "qualityScore": cjk - replacement * 5 + min(len(normalized), 4000) // 20,
    }

try:
    reader = PdfReader(path)
    chunks = []
    sample_pages = min(len(reader.pages), 12)
    for page in reader.pages[:sample_pages]:
        try:
            chunks.append(page.extract_text() or "")
        except Exception:
            chunks.append("")
    result["engines"]["pypdf"] = {
        "ok": True,
        "pageCount": len(reader.pages),
        "samplePages": sample_pages,
        **metrics("\n".join(chunks)),
    }
except Exception as exc:
    result["engines"]["pypdf"] = {"ok": False, "error": str(exc)}

try:
    doc = fitz.open(path)
    chunks = []
    sample_pages = min(doc.page_count, 12)
    for index in range(sample_pages):
        try:
            chunks.append(doc.load_page(index).get_text("text") or "")
        except Exception:
            chunks.append("")
    result["engines"]["fitz"] = {
        "ok": True,
        "pageCount": doc.page_count,
        "samplePages": sample_pages,
        **metrics("\n".join(chunks)),
    }
    doc.close()
except Exception as exc:
    result["engines"]["fitz"] = {"ok": False, "error": str(exc)}

best_name = None
best_score = None
for name, probe in result["engines"].items():
    if not probe.get("ok"):
        continue
    score = probe.get("qualityScore", -10**9)
    if best_score is None or score > best_score:
        best_name = name
        best_score = score
result["bestEngine"] = best_name
if best_name:
    result.update(result["engines"][best_name])
else:
    result.update({"ok": False, "error": "No PDF text extraction engine succeeded."})

print(json.dumps(result, ensure_ascii=False))
`

  const child = spawnSync("python", ["-c", code, pdfPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    maxBuffer: 1024 * 1024 * 20,
  })

  if (child.error) {
    return { ok: false, error: child.error.message }
  }
  if (child.status !== 0) {
    return { ok: false, error: child.stderr || `Python exited with ${child.status}` }
  }
  return JSON.parse(child.stdout)
}

function classifyProbe(probe) {
  if (!probe.ok) return "extract-error"
  if (probe.pageCount === 0) return "invalid-pdf"
  if ((probe.replacementChars ?? 0) > 20 || probe.cjkChars < 80) return "needs-ocr-or-encoding-fix"
  if (probe.textChars >= 1200 && probe.cjkChars >= 300) return "text-ready"
  if (probe.textChars >= 300 && probe.cjkChars >= 80) return "partial-text"
  return "needs-ocr"
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
const selected = FIRST_BATCH_TITLES.map((title) => manifest.books.find((book) => book.title === title)).filter(Boolean)

const results = []
for (const book of selected) {
  const probe = runPythonProbe(book.absolutePath)
  results.push({
    id: book.id,
    title: book.title,
    grade: book.grade,
    term: book.term,
    readingType: book.readingType,
    primaryRegionId: book.primaryRegionId,
    relativePath: book.relativePath,
    fileSize: book.fileSize,
    probe,
    importReadiness: classifyProbe(probe),
  })
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceManifest: manifestPath,
  total: results.length,
  results,
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

const byReadiness = new Map()
for (const row of results) {
  byReadiness.set(row.importReadiness, (byReadiness.get(row.importReadiness) ?? 0) + 1)
}

console.log(`Wrote ${results.length} PDF probe results to ${outputPath}`)
console.log([...byReadiness.entries()].map(([key, count]) => `${key}: ${count}`).join(" | "))
for (const row of results) {
  console.log(`${row.importReadiness.padEnd(13)} ${String(row.probe.pageCount).padStart(4)}p ${String(row.probe.textChars).padStart(6)} chars ${row.title}`)
}
