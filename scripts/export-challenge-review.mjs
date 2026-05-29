import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const draftsIndexPath = path.resolve(appRoot, "data", "imported-books", "challenge-drafts-index.json")
const outputDir = path.resolve(appRoot, "data", "imported-books", "review")
const csvPath = path.join(outputDir, "challenge-review.csv")
const jsonPath = path.join(outputDir, "challenge-review.json")

function csvEscape(value) {
  const text = value == null ? "" : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function flattenDraftBook(bookDraft) {
  const rows = []
  for (const chapter of bookDraft.chapters) {
    for (const question of chapter.questions) {
      rows.push({
        reviewStatus: "pending",
        reviewer: "",
        reviewNotes: "",
        bookId: bookDraft.id,
        bookTitle: bookDraft.title,
        grade: bookDraft.grade,
        term: bookDraft.term,
        readingType: bookDraft.readingType,
        regionId: bookDraft.primaryRegionId,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.chapterTitle,
        questionId: question.id,
        questionType: question.type,
        difficulty: question.difficulty,
        prompt: question.prompt,
        options: (question.options ?? []).join(" | "),
        answerIndex: question.answerIndex ?? "",
        answerText: question.answerText ?? "",
        answerRubric: (question.answerRubric ?? []).join(" | "),
        successResponse: question.successResponse,
        retryResponse: question.retryResponse,
        sourceLabel: question.sourceLabel,
        sourceExcerpt: question.sourceExcerpt,
      })
    }
  }
  return rows
}

const draftsIndex = JSON.parse(await readFile(draftsIndexPath, "utf8"))
const rows = []

for (const book of draftsIndex.books) {
  const draftPath = path.resolve(appRoot, book.outputPath)
  const draft = JSON.parse(await readFile(draftPath, "utf8"))
  rows.push(...flattenDraftBook(draft))
}

const columns = [
  "reviewStatus",
  "reviewer",
  "reviewNotes",
  "bookTitle",
  "grade",
  "term",
  "readingType",
  "regionId",
  "chapterTitle",
  "questionType",
  "difficulty",
  "prompt",
  "options",
  "answerIndex",
  "answerText",
  "answerRubric",
  "successResponse",
  "retryResponse",
  "sourceLabel",
  "sourceExcerpt",
  "bookId",
  "chapterId",
  "questionId",
]

const csv = [
  columns.map(csvEscape).join(","),
  ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
].join("\n")

await mkdir(outputDir, { recursive: true })
await writeFile(csvPath, `\ufeff${csv}\n`, "utf8")
await writeFile(
  jsonPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceDraftsIndex: path.relative(appRoot, draftsIndexPath).split(path.sep).join("/"),
      totalQuestions: rows.length,
      reviewStatusValues: ["pending", "approved", "needs_rewrite", "rejected"],
      rows,
    },
    null,
    2,
  )}\n`,
  "utf8",
)

const byType = rows.reduce((acc, row) => {
  acc[row.questionType] = (acc[row.questionType] ?? 0) + 1
  return acc
}, {})

console.log(`Wrote ${rows.length} review rows`)
console.log(`CSV: ${csvPath}`)
console.log(`JSON: ${jsonPath}`)
console.log(JSON.stringify(byType))
