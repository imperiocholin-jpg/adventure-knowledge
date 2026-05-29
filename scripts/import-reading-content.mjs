import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"))
}

function readEnv() {
  const envPath = path.join(ROOT, ".env.local")
  const raw = fs.readFileSync(envPath, "utf8")
  const entries = raw
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=")
      return idx > 0 ? [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] : null
    })
    .filter(Boolean)
  return Object.fromEntries(entries)
}

function resolveDatabaseUrl(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL
  const password = env.SUPABASE_DB_PASSWORD || env.DATABASE_PASSWORD
  if (!password) return null
  const ref = env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!ref) return null
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
}

async function applyMigrationIfPossible(env) {
  const databaseUrl = resolveDatabaseUrl(env)
  if (!databaseUrl) {
    console.log("Skipped SQL migration: DATABASE_URL or SUPABASE_DB_PASSWORD is not configured.")
    console.log("Apply supabase/migrations/20260604000000_reading_content_pipeline.sql in Supabase SQL Editor first.")
    return false
  }

  const sql = fs.readFileSync(path.join(ROOT, "supabase/migrations/20260604000000_reading_content_pipeline.sql"), "utf8")
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(sql)
    console.log("Applied reading content pipeline migration.")
    return true
  } finally {
    await client.end()
  }
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size))
  return chunks
}

function toBookRows(batchIndex, chapterIndex, reviewIndex) {
  const chapterByBook = new Map(chapterIndex.books.map((book) => [book.id, book]))
  const reviewByBook = new Map(reviewIndex.books.map((book) => [book.id, book]))

  return batchIndex.books
    .filter((book) => book.ok)
    .map((book) => {
      const chapters = chapterByBook.get(book.id)
      const questions = reviewByBook.get(book.id)
      return {
        local_content_id: book.id,
        title: book.title,
        author: "",
        region_id: null,
        grade_band: null,
        category: null,
        term: null,
        reading_type: null,
        content_status: "draft_questions",
        chapter_count: chapters?.chapterCount ?? 0,
        question_count: questions?.questionCount ?? 0,
        source_path: book.rawTextPath,
        metadata: {
          source: "local-pdf-first-batch",
          engine: book.engine,
          sourcePageCount: book.sourcePageCount,
          extractedPageCount: book.extractedPageCount,
          textChars: book.textChars,
        },
        updated_at: new Date().toISOString(),
      }
    })
}

function applyBookFilter(rows, onlyBookIds, bookIdKey = "book_id") {
  if (onlyBookIds.size === 0) return rows
  return rows.filter((row) => onlyBookIds.has(row[bookIdKey]))
}

function toChapterRows(chapterIndex) {
  const rows = []
  for (const bookRef of chapterIndex.books) {
    const book = readJson(bookRef.outputPath)
    for (const chapter of book.chapters) {
      rows.push({
        id: chapter.id,
        book_id: book.id,
        chapter_no: chapter.chapterNo,
        title: chapter.title,
        text: chapter.text,
        summary: chapter.summaryDraft,
        char_count: chapter.charCount,
        estimated_minutes: chapter.estimatedMinutes,
        source_start_page: chapter.sourceStartPage,
        split_method: chapter.splitMethod,
        status: "draft",
        metadata: {
          source: "local-pdf-first-batch",
          sourceRawTextPath: book.sourceRawTextPath,
        },
        updated_at: new Date().toISOString(),
      })
    }
  }
  return rows
}

function toQuestionRows(reviewJson) {
  return reviewJson.rows.map((row) => ({
    id: row.questionId,
    book_id: row.bookId,
    chapter_id: row.chapterId,
    region_id: row.regionId,
    question_type: row.questionType,
    prompt: row.prompt,
    options: row.options ? row.options.split(" | ").filter(Boolean) : [],
    answer_index: row.answerIndex === "" ? null : Number(row.answerIndex),
    answer_text: row.answerText,
    answer_rubric: row.answerRubric ? row.answerRubric.split(" | ").filter(Boolean) : [],
    success_response: row.successResponse,
    retry_response: row.retryResponse,
    source_label: row.sourceLabel,
    source_excerpt: row.sourceExcerpt,
    difficulty: Number(row.difficulty) || 1,
    status: row.reviewStatus === "approved" ? "approved" : "draft",
    reviewer: row.reviewer || null,
    review_notes: row.reviewNotes || null,
    metadata: {
      source: "generated-draft",
    },
    updated_at: new Date().toISOString(),
  }))
}

async function restUpsert(env, table, rows, conflictTarget = "id") {
  if (rows.length === 0) return
  const url = new URL(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`)
  url.searchParams.set("on_conflict", conflictTarget)
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${table}: HTTP ${response.status} ${body}`)
  }
}

async function upsertAll(env, table, rows, batchSize = 50, conflictTarget = "id") {
  let count = 0
  for (const part of chunk(rows, batchSize)) {
    await restUpsert(env, table, part, conflictTarget)
    count += part.length
  }
  return count
}

async function main() {
  const env = readEnv()
  await applyMigrationIfPossible(env)
  const onlyBookIds = new Set(process.argv.slice(2).filter(Boolean))

  const batchIndex = readJson("data/imported-books/first-batch-index.json")
  const chapterIndex = readJson("data/imported-books/first-batch-chapters-index.json")
  const draftsIndex = readJson("data/imported-books/challenge-drafts-index.json")
  const reviewJson = readJson("data/imported-books/review/challenge-review.json")

  const books = applyBookFilter(toBookRows(batchIndex, chapterIndex, draftsIndex), onlyBookIds, "local_content_id")
  const chapters = applyBookFilter(toChapterRows(chapterIndex), onlyBookIds)
  const questions = applyBookFilter(toQuestionRows(reviewJson), onlyBookIds)

  const bookCount = await upsertAll(env, "books", books, 50, "local_content_id")
  const chapterCount = await upsertAll(env, "book_chapters", chapters, 25)
  const questionCount = await upsertAll(env, "challenge_questions", questions, 25)

  console.log(
    JSON.stringify(
      {
        ok: true,
        books: bookCount,
        chapters: chapterCount,
        questions: questionCount,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
