import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export async function readJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  const filePath = path.join(process.cwd(), relativePath)
  try {
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(relativePath: string, data: unknown) {
  const filePath = path.join(process.cwd(), relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8")
}
