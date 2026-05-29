import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const appRoot = process.cwd()
const chapterIndexPath = path.resolve(appRoot, "data", "imported-books", "first-batch-chapters-index.json")
const outputDir = path.resolve(appRoot, "data", "imported-books", "challenge-drafts")
const outputIndexPath = path.resolve(appRoot, "data", "imported-books", "challenge-drafts-index.json")

const maxQuestionsPerChapter = Number(process.argv[2] ?? 3)

const REGION_NPC = {
  "magic-forest": "林间守护者",
  "ice-mountain": "雪峰向导",
  "ancient-desert": "沙漠记录员",
  "ocean-ruins": "海底探路员",
  "sky-kingdom": "云端信使",
  "dream-tower": "梦塔管理员",
}

const QUESTION_TYPES = ["memory", "plot_choice", "npc_dialogue"]

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function compactText(value) {
  return value.replace(/\s+/g, "")
}

function cleanTerm(value) {
  return compactText(value)
    .replace(/[，。！？；：“”"《》、（）()[\]{}]/g, "")
    .trim()
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function splitSentences(text) {
  return normalizeText(text)
    .split(/(?<=[。！？!?])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12)
}

function extractQuotedTerms(text) {
  const terms = []
  const patterns = [/“([^”]{2,12})”/g, /"([^"]{2,12})"/g, /《([^》]{2,12})》/g]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const term = cleanTerm(match[1])
      if (term) terms.push(term)
    }
  }
  return terms
}

function extractCandidateTerms(text, bookTitle) {
  const compact = compactText(text)
  const quoted = extractQuotedTerms(text)
  const chineseRuns = [...compact.matchAll(/[\u4e00-\u9fa5]{2,5}/g)].map((match) => cleanTerm(match[0]))
  const stopWords = new Set([
    "一个",
    "他们",
    "我们",
    "自己",
    "时候",
    "什么",
    "没有",
    "不是",
    "这个",
    "那个",
    "起来",
    "一直",
    "因为",
    "所以",
    "如果",
    "可是",
    "但是",
    "孩子",
    "爸爸",
    "妈妈",
    "作者",
    "目录",
    "版权",
    "作者介绍",
    "圣埃克絮",
    "图书在版",
    "出版社",
    "翻译",
    "插图",
    "公众号",
    "资料",
    bookTitle,
  ])

  const scored = new Map()
  for (const term of [...quoted, ...chineseRuns]) {
    if (term.length < 2 || stopWords.has(term)) continue
    if (term.length > 8 && !quoted.includes(term)) continue
    if (/^[一二三四五六七八九十百千万]+$/.test(term)) continue
    if (/^\d+$/.test(term)) continue
    scored.set(term, (scored.get(term) ?? 0) + (quoted.includes(term) ? 4 : 1))
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, 8)
}

function pickSourceSentences(chapterText) {
  const sentences = splitSentences(chapterText)
  const meaningful = sentences.filter((sentence) => {
    const compact = compactText(sentence)
    if (compact.length < 18 || compact.length > 120) return false
    if (
      compact.includes("ISBN") ||
      compact.includes("版权") ||
      compact.includes("目录") ||
      compact.includes("作者介绍") ||
      compact.includes("图书在版") ||
      compact.includes("出版社") ||
      compact.includes("关注公众号") ||
      compact.includes("仅供学习")
    ) {
      return false
    }
    return /[\u4e00-\u9fa5]/.test(compact)
  })
  if (meaningful.length >= 3) return [meaningful[0], meaningful[Math.floor(meaningful.length / 2)], meaningful.at(-1)]
  return meaningful
}

function buildOptions(answer, terms, fallbackOptions) {
  const options = [answer]
  for (const term of terms) {
    if (options.length >= 3) break
    if (term !== answer && !options.includes(term)) options.push(term)
  }
  for (const option of fallbackOptions) {
    if (options.length >= 3) break
    if (!options.includes(option)) options.push(option)
  }
  return options.slice(0, 3)
}

function buildQuestion(params) {
  const { book, chapter, type, sourceSentence, terms, index } = params
  const npc = REGION_NPC[book.primaryRegionId] ?? "冒险伙伴"
  const sourceLabel = `《${book.title}》·${chapter.title}`
  const compactSource = compactText(sourceSentence)
  const answerTerm = terms.find((term) => compactSource.includes(term)) ?? terms[0] ?? book.title
  const safeAnswer = answerTerm.length > 12 ? answerTerm.slice(0, 12) : answerTerm

  if (type === "memory") {
    const options = buildOptions(safeAnswer, terms, ["小路", "星光", "伙伴"])
    return {
      id: `${chapter.id}-q${index + 1}`,
      type,
      prompt: `${npc}轻声问：刚才这段里，哪个线索最值得记住？`,
      options,
      answerIndex: 0,
      answerText: options[0],
      successResponse: `${npc}点点头：对，就是这个线索。你已经抓住故事里的关键了。`,
      retryResponse: `${npc}提醒你：回到刚才读过的片段，找一找反复出现或推动情节的词。`,
      sourceLabel,
      sourceExcerpt: sourceSentence,
      difficulty: 1,
      status: "draft",
      reviewNotes: "",
    }
  }

  if (type === "plot_choice") {
    return {
      id: `${chapter.id}-q${index + 1}`,
      type,
      prompt: `${npc}摊开地图：如果要继续冒险，下面哪个行动最像这一段故事接下来会发生的事？`,
      options: [
        `沿着“${safeAnswer}”这条线索继续找`,
        "先离开故事去做别的事",
        "假装什么都没有发生",
      ],
      answerIndex: 0,
      answerText: `沿着“${safeAnswer}”这条线索继续找`,
      successResponse: `${npc}露出笑容：没错，真正的冒险者会顺着故事线索往前走。`,
      retryResponse: `${npc}指了指书页：想一想，这一段里什么事情让故事继续前进？`,
      sourceLabel,
      sourceExcerpt: sourceSentence,
      difficulty: 2,
      status: "draft",
      reviewNotes: "",
    }
  }

  return {
    id: `${chapter.id}-q${index + 1}`,
    type,
    prompt: `${npc}说：请用一句话告诉我，这段故事里发生了什么重要变化？`,
    options: [],
    answerIndex: null,
    answerText: `围绕“${safeAnswer}”说明故事变化`,
    answerRubric: [
      `提到“${safeAnswer}”或同义线索`,
      "能说明人物、事件或情绪的变化",
      "不是只抄一句无关原文",
    ],
    successResponse: `${npc}把这条线索记进冒险日志：说得好，我们可以继续前进了。`,
    retryResponse: `${npc}温和地说：可以再具体一点，说说谁做了什么，或者发生了什么变化。`,
    sourceLabel,
    sourceExcerpt: sourceSentence,
    difficulty: 2,
    status: "draft",
    reviewNotes: "",
  }
}

function generateQuestionsForChapter(book, chapter) {
  const sourceSentences = pickSourceSentences(chapter.text)
  const terms = extractCandidateTerms(chapter.text, book.title)
  const questions = []

  for (let index = 0; index < maxQuestionsPerChapter; index += 1) {
    const type = QUESTION_TYPES[index % QUESTION_TYPES.length]
    const sourceSentence = sourceSentences[index % sourceSentences.length] ?? chapter.text.slice(0, 100)
    questions.push(buildQuestion({ book, chapter, type, sourceSentence, terms, index }))
  }

  return questions
}

const chapterIndex = JSON.parse(await readFile(chapterIndexPath, "utf8"))
await mkdir(outputDir, { recursive: true })

const indexRows = []
let totalQuestions = 0

for (const bookRow of chapterIndex.books) {
  const chapterFilePath = path.resolve(appRoot, bookRow.outputPath)
  const book = JSON.parse(await readFile(chapterFilePath, "utf8"))
  const chapterDrafts = book.chapters.map((chapter) => {
    const questions = generateQuestionsForChapter(book, chapter)
    totalQuestions += questions.length
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      charCount: chapter.charCount,
      estimatedMinutes: chapter.estimatedMinutes,
      questions,
    }
  })

  const payload = {
    id: book.id,
    title: book.title,
    grade: book.grade,
    term: book.term,
    readingType: book.readingType,
    primaryRegionId: book.primaryRegionId,
    sourceChapterPath: bookRow.outputPath,
    status: "draft",
    chapters: chapterDrafts,
  }

  const outputPath = path.join(outputDir, `${slugify(book.id)}.json`)
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")

  indexRows.push({
    id: book.id,
    title: book.title,
    chapterCount: chapterDrafts.length,
    questionCount: chapterDrafts.reduce((sum, chapter) => sum + chapter.questions.length, 0),
    status: "draft",
    outputPath: path.relative(appRoot, outputPath).split(path.sep).join("/"),
  })
}

await writeFile(
  outputIndexPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sourceChapterIndex: path.relative(appRoot, chapterIndexPath).split(path.sep).join("/"),
      maxQuestionsPerChapter,
      totalBooks: indexRows.length,
      totalChapters: chapterIndex.totalChapters,
      totalQuestions,
      books: indexRows,
    },
    null,
    2,
  )}\n`,
  "utf8",
)

console.log(`Wrote ${totalQuestions} draft questions for ${indexRows.length} books`)
console.log(`Index: ${outputIndexPath}`)
for (const row of indexRows) {
  console.log(`${String(row.questionCount).padStart(3)} questions ${row.title}`)
}
