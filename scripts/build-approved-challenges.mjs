import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const reviewJsonPath = path.resolve(appRoot, "data", "imported-books", "review", "challenge-review.json")
const outputDir = path.resolve(appRoot, "data", "imported-books", "approved")
const outputPath = path.join(outputDir, "approved-challenges.json")

function toInt(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const review = JSON.parse(await readFile(reviewJsonPath, "utf8"))
const approvedRows = review.rows.filter((row) => row.reviewStatus === "approved")

const questions = approvedRows.map((row) => ({
  id: row.questionId,
  bookId: row.bookId,
  bookTitle: row.bookTitle,
  grade: toInt(row.grade, null),
  term: row.term,
  readingType: row.readingType,
  regionId: row.regionId,
  chapterId: row.chapterId,
  chapterTitle: row.chapterTitle,
  type: row.questionType,
  difficulty: toInt(row.difficulty, 1),
  prompt: row.prompt,
  options: row.options ? row.options.split(" | ").filter(Boolean) : [],
  answerIndex: row.answerIndex === "" ? null : toInt(row.answerIndex, null),
  answerText: row.answerText,
  answerRubric: row.answerRubric ? row.answerRubric.split(" | ").filter(Boolean) : [],
  successResponse: row.successResponse,
  retryResponse: row.retryResponse,
  sourceLabel: row.sourceLabel,
  sourceExcerpt: row.sourceExcerpt,
  status: "approved",
}))

const byChapter = new Map()
for (const question of questions) {
  const current = byChapter.get(question.chapterId) ?? {
    bookId: question.bookId,
    bookTitle: question.bookTitle,
    regionId: question.regionId,
    chapterId: question.chapterId,
    chapterTitle: question.chapterTitle,
    questions: [],
  }
  current.questions.push(question)
  byChapter.set(question.chapterId, current)
}

const payload = {
  generatedAt: new Date().toISOString(),
  sourceReviewJson: path.relative(appRoot, reviewJsonPath).split(path.sep).join("/"),
  totalQuestions: questions.length,
  totalChapters: byChapter.size,
  chapters: [...byChapter.values()],
}

await mkdir(outputDir, { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

console.log(`Approved questions: ${questions.length}`)
console.log(`Approved chapters: ${byChapter.size}`)
console.log(`Output: ${outputPath}`)
