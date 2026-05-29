import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const manifestPath = path.join(appRoot, "data", "local-book-manifest.json")
const outputDir = path.join(appRoot, "data", "book-covers")
const coverDir = path.join(appRoot, "public", "image", "book-covers")

function buildBookCoverFileName(bookId, ext) {
  return `${bookId}.${ext}`
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))

await mkdir(outputDir, { recursive: true })
await mkdir(coverDir, { recursive: true })

const slots = manifest.books.map((book) => ({
  id: book.id,
  title: book.title,
  grade: book.grade,
  regionId: book.primaryRegionId,
  recommendedFile: buildBookCoverFileName(book.id, "webp"),
  alsoSupported: ["png", "jpg", "jpeg"].map((ext) => buildBookCoverFileName(book.id, ext)),
}))

await writeFile(
  path.join(outputDir, "cover-slots.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), total: slots.length, slots }, null, 2)}\n`,
  "utf8",
)

const readme = `书封放置说明
================

目录：public/image/book-covers/

命名规则（与书名完全一致，推荐）：
  {书名}.webp   （推荐）
  {书名}.png
  {书名}.jpg

也支持按书目 ID 命名（与 data/book-covers/cover-slots.json 中 id 一致）：
  {书目ID}.webp

示例：
  小巴掌童话.webp
  365夜故事.png
  local-1年级-一年级上册必读-小巴掌童话.webp

完整文件名清单见：data/book-covers/cover-slots.json

放入图片后刷新书架/后台即可看到封面；未放置的仍显示区域默认图标。
`

await writeFile(path.join(coverDir, "README.txt"), readme, "utf8")

console.log(`Wrote ${slots.length} cover slots to data/book-covers/cover-slots.json`)
console.log(`Cover folder: public/image/book-covers/`)
