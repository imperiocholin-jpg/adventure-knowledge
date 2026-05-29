import type { StoryChapter } from "@/lib/story/types"

export async function loadChapter(chapterId: string): Promise<StoryChapter> {
  const response = await fetch(`/story/chapters/${chapterId}.json`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`章节加载失败: ${chapterId}`)
  }
  return (await response.json()) as StoryChapter
}
