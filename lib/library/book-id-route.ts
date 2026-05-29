/** 统一书目 ID 在动态路由中的编解码，避免中文 ID 在 URL 中匹配失败 */

export function normalizeBookId(raw: string) {
  let value = raw.trim()
  if (!value) return value

  for (let i = 0; i < 2; i += 1) {
    if (!value.includes("%")) break
    try {
      const decoded = decodeURIComponent(value)
      if (decoded === value) break
      value = decoded
    } catch {
      break
    }
  }

  return value
}

export function bookReadPath(bookId: string) {
  return `/library/read/${encodeURIComponent(normalizeBookId(bookId))}`
}

export function bookApiPath(bookId: string) {
  return `/api/library/books/${encodeURIComponent(normalizeBookId(bookId))}`
}
