import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

/** 固定 admin 数据目录，避免 Vercel 构建时追踪整个项目文件树 */
const ADMIN_DATA_DIR = path.join(process.cwd(), "data", "admin")

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = path.join(ADMIN_DATA_DIR, fileName)
  try {
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(fileName: string, data: unknown) {
  const filePath = path.join(ADMIN_DATA_DIR, fileName)
  await mkdir(ADMIN_DATA_DIR, { recursive: true })
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
}
