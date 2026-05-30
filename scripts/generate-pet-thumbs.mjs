import { readdir, stat } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const appRoot = process.cwd()
const defaultPetDir = path.join(appRoot, "public", "image", "pets")

const THUMB_MAX = 256
const WEBP_QUALITY = 78

function parseArgs(argv) {
  const options = { dir: defaultPetDir, dryRun: false, force: false }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--dry-run") options.dryRun = true
    else if (arg === "--force") options.force = true
    else if (arg === "--dir") {
      options.dir = path.resolve(argv[i + 1] ?? "")
      i += 1
    } else if (arg === "--help" || arg === "-h") {
      console.log(`用法: node scripts/generate-pet-thumbs.mjs [--dir <路径>] [--force] [--dry-run]`)
      process.exit(0)
    } else {
      throw new Error(`未知参数：${arg}`)
    }
  }

  return options
}

async function collectPngFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectPngFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".png") && !entry.name.includes("-thumb")) {
      files.push(fullPath)
    }
  }

  return files
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const pngFiles = await collectPngFiles(options.dir)
  let created = 0
  let skipped = 0

  for (const pngPath of pngFiles) {
    const thumbPath = pngPath.replace(/\.png$/i, "-thumb.webp")
    if (!options.force) {
      try {
        const [srcStat, thumbStat] = await Promise.all([stat(pngPath), stat(thumbPath)])
        if (thumbStat.mtimeMs >= srcStat.mtimeMs) {
          skipped += 1
          continue
        }
      } catch {
        // thumb 不存在，继续生成
      }
    }

    if (options.dryRun) {
      console.log(`[dry-run] ${path.relative(appRoot, thumbPath)}`)
      created += 1
      continue
    }

    await sharp(pngPath)
      .resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(thumbPath)

    const srcKb = Math.round((await stat(pngPath)).size / 1024)
    const thumbKb = Math.round((await stat(thumbPath)).size / 1024)
    console.log(`${path.basename(thumbPath)}  ${srcKb}KB → ${thumbKb}KB`)
    created += 1
  }

  console.log(`完成：生成 ${created}，跳过 ${skipped}，共扫描 ${pngFiles.length} 张 PNG`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
