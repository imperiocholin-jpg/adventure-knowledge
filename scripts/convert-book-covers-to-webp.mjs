import { readdir, stat, unlink } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const appRoot = process.cwd()
const defaultCoverDir = path.join(appRoot, "public", "image", "book-covers")

const TARGET_WIDTH = 600
const TARGET_HEIGHT = 800
const WEBP_QUALITY = 82
const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"])

function parseArgs(argv) {
  const options = {
    dir: defaultCoverDir,
    dryRun: false,
    force: false,
    deleteSource: false,
    quality: WEBP_QUALITY,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--dry-run") options.dryRun = true
    else if (arg === "--force") options.force = true
    else if (arg === "--delete-source") options.deleteSource = true
    else if (arg === "--dir") {
      options.dir = path.resolve(argv[i + 1] ?? "")
      i += 1
    } else if (arg === "--quality") {
      options.quality = Number(argv[i + 1])
      i += 1
    } else if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    } else {
      throw new Error(`未知参数：${arg}`)
    }
  }

  if (!Number.isFinite(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error("--quality 必须是 1～100 之间的数字")
  }

  return options
}

function printHelp() {
  console.log(`批量将书封 PNG/JPG 转为 600×800 WebP

用法：
  pnpm covers:to-webp [选项]

选项：
  --dir <路径>        书封目录（默认 public/image/book-covers）
  --quality <1-100>   WebP 质量（默认 82）
  --force             覆盖已存在的 .webp
  --delete-source     转换成功后删除原图
  --dry-run           只预览，不写入文件
  -h, --help          显示帮助

说明：
  - 输出文件名与源文件主名一致，仅扩展名改为 .webp
  - 缩放策略为 cover（居中裁剪到 3:4），与书架展示一致
  - 会跳过 README.txt、.gitkeep 等非图片文件
`)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function shouldSkipConversion(sourcePath, outputPath, force) {
  if (force) return false

  try {
    const [sourceStat, outputStat] = await Promise.all([stat(sourcePath), stat(outputPath)])
    return outputStat.mtimeMs >= sourceStat.mtimeMs
  } catch {
    return false
  }
}

async function convertOne(fileName, options) {
  const sourcePath = path.join(options.dir, fileName)
  const baseName = path.parse(fileName).name
  const outputName = `${baseName}.webp`
  const outputPath = path.join(options.dir, outputName)

  if (!(await shouldSkipConversion(sourcePath, outputPath, options.force))) {
    if (options.dryRun) {
      console.log(`[dry-run] ${fileName} -> ${outputName}`)
      return { status: "converted", fileName, outputName, savedBytes: 0 }
    }

    const sourceStat = await stat(sourcePath)
    await sharp(sourcePath)
      .rotate()
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: "cover",
        position: "centre",
      })
      .webp({ quality: options.quality })
      .toFile(outputPath)

    const outputStat = await stat(outputPath)

    if (options.deleteSource && sourcePath !== outputPath) {
      await unlink(sourcePath)
    }

    const savedBytes = Math.max(0, sourceStat.size - outputStat.size)
    console.log(
      `✓ ${fileName} -> ${outputName}  ${formatBytes(sourceStat.size)} -> ${formatBytes(outputStat.size)}  (省 ${formatBytes(savedBytes)})`,
    )
    return { status: "converted", fileName, outputName, savedBytes }
  }

  console.log(`- 跳过 ${fileName}（${outputName} 已是最新）`)
  return { status: "skipped", fileName, outputName, savedBytes: 0 }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const entries = await readdir(options.dir, { withFileTypes: true })
  const sources = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => SOURCE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))

  if (sources.length === 0) {
    console.log(`目录中没有可转换的 PNG/JPG：${options.dir}`)
    return
  }

  console.log(
    `处理 ${sources.length} 个文件 @ ${options.dir}\n目标尺寸：${TARGET_WIDTH}×${TARGET_HEIGHT}  WebP 质量：${options.quality}`,
  )

  const summary = {
    converted: 0,
    skipped: 0,
    savedBytes: 0,
  }

  for (const fileName of sources) {
    const result = await convertOne(fileName, options)
    if (result.status === "converted") summary.converted += 1
    if (result.status === "skipped") summary.skipped += 1
    summary.savedBytes += result.savedBytes
  }

  console.log(
    `\n完成：转换 ${summary.converted}，跳过 ${summary.skipped}，共节省约 ${formatBytes(summary.savedBytes)}`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
