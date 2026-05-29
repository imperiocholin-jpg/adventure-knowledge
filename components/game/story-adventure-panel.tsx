"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { StoryChapter } from "@/lib/story/types"

interface StoryAdventurePanelProps {
  open: boolean
  chapter: StoryChapter | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onChooseNext: (nextChapterId: string) => Promise<void> | void
  onCompleteChapter: () => Promise<void> | void
  sourceBookTitle?: string
  sourceChapterLabel?: string
  entryMode?: "post_read" | "direct"
}

export function StoryAdventurePanel({
  open,
  chapter,
  loading = false,
  error = null,
  onClose,
  onChooseNext,
  onCompleteChapter,
  sourceBookTitle,
  sourceChapterLabel,
  entryMode = "post_read",
}: StoryAdventurePanelProps) {
  const [sectionIndex, setSectionIndex] = useState(0)
  const [showChallenge, setShowChallenge] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [challengeCorrect, setChallengeCorrect] = useState<boolean | null>(null)
  const [isActioning, setIsActioning] = useState(false)

  useEffect(() => {
    setSectionIndex(0)
    setShowChallenge(entryMode === "direct")
    setShowFeedback(false)
    setChallengeCorrect(null)
    setIsActioning(false)
  }, [chapter?.chapterId, entryMode])

  const currentSection = useMemo(() => {
    if (!chapter || chapter.sections.length === 0) return null
    return chapter.sections[Math.min(sectionIndex, chapter.sections.length - 1)]
  }, [chapter, sectionIndex])

  if (!open) return null

  const handleNext = () => {
    if (!chapter) return
    if (sectionIndex < chapter.sections.length - 1) {
      setSectionIndex((prev) => prev + 1)
      return
    }
    setShowChallenge(true)
  }

  const handleChoice = async (nextChapterId: string) => {
    setIsActioning(true)
    try {
      await onCompleteChapter()
      await onChooseNext(nextChapterId)
    } finally {
      setIsActioning(false)
    }
  }

  const challengePrompt =
    chapter?.challenge?.prompt ??
    "你觉得刚刚这段故事里，最关键的变化是什么？"
  const challengeOptions =
    chapter?.challenge?.options?.length
      ? chapter.challenge.options
      : ["主角找到了新的线索", "故事什么都没发生"]
  const answerIndex =
    typeof chapter?.challenge?.answerIndex === "number" ? chapter.challenge.answerIndex : 0
  const resolvedSourceBookTitle = sourceBookTitle ?? chapter?.challenge?.sourceBookTitle ?? chapter?.sourceBookTitle
  const resolvedSourceChapterLabel =
    sourceChapterLabel ?? chapter?.challenge?.sourceChapterLabel ?? chapter?.sourceChapterLabel

  const handleAnswerChallenge = (optionIndex: number) => {
    const correct = optionIndex === answerIndex
    setChallengeCorrect(correct)
    setShowFeedback(true)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-md flex-col bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">阅读冒险</p>
            <h2 className="text-sm font-semibold">{chapter?.title ?? "加载中..."}</h2>
            {(resolvedSourceBookTitle || resolvedSourceChapterLabel) && (
              <p className="text-[11px] text-primary mt-0.5">
                题源：{resolvedSourceBookTitle ? `《${resolvedSourceBookTitle}》` : ""}
                {resolvedSourceChapterLabel ?? ""}
              </p>
            )}
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && <p className="text-sm text-muted-foreground">正在加载章节...</p>}
          {error && <p className="text-sm text-amber-600">{error}</p>}
          {!loading && !error && chapter && !showChallenge && !showFeedback && currentSection && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-3">
                <p className="text-xs text-muted-foreground">
                  第 {sectionIndex + 1} 段 / 共 {chapter.sections.length} 段
                </p>
                <p className="mt-2 text-sm leading-7 text-card-foreground">{currentSection.text}</p>
              </div>
            </div>
          )}

          {!loading && !error && chapter && showChallenge && !showFeedback && (
            <div className="space-y-4">
              {entryMode === "direct" && (
                <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-3">
                  <p className="text-xs text-amber-700">
                    你选择了直接挑战模式，适合已经读过这段内容的小队长快速复盘。
                  </p>
                </div>
              )}
              <div className="rounded-xl border bg-card p-3">
                <p className="mb-2 text-xs font-semibold text-primary">读后小挑战</p>
                <p className="text-sm leading-6">{challengePrompt}</p>
              </div>
              <div className="grid gap-2">
                {challengeOptions.map((option, optionIndex) => (
                  <Button
                    key={`${chapter.chapterId}-challenge-${optionIndex}`}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleAnswerChallenge(optionIndex)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && chapter && showFeedback && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-3">
                <p className="mb-2 text-xs font-semibold text-primary">AI伙伴</p>
                <p className="text-sm leading-6">
                  {challengeCorrect === false
                    ? chapter.challenge?.retryResponse ?? "没关系，我们已经接近答案啦！再观察一次就能更稳。"
                    : chapter.challenge?.successResponse ?? chapter.aiCompanionLine}
                </p>
              </div>

              {challengeCorrect === false ? (
                <div className="rounded-xl border bg-card p-3">
                  <p className="mb-2 text-xs font-semibold text-primary">继续挑战</p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowFeedback(false)
                      setShowChallenge(true)
                      setChallengeCorrect(null)
                    }}
                  >
                    再试一次
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="mb-2 text-xs font-semibold text-primary">毛毛反馈</p>
                    <p className="text-sm leading-6">{chapter.petFeedback.text}</p>
                  </div>

                  <div className="rounded-xl border bg-card p-3">
                    <p className="mb-2 text-xs font-semibold text-primary">本章奖励</p>
                    <p className="text-sm leading-6">{chapter.reward.text}</p>
                  </div>

                  <div className="rounded-xl border bg-card p-3">
                    <p className="mb-2 text-xs font-semibold text-primary">下一步选择</p>
                    <div className="grid gap-2">
                      {chapter.lightChoices.map((choice) => (
                        <Button
                          key={choice.id}
                          variant="outline"
                          className="justify-start"
                          disabled={isActioning}
                          onClick={() => handleChoice(choice.nextChapterId)}
                        >
                          <Sparkles className="mr-2 h-4 w-4 text-primary" />
                          {choice.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!loading && !error && chapter && !showChallenge && !showFeedback && (
          <div className="border-t px-4 py-3">
            <Button className="w-full" onClick={handleNext}>
              {sectionIndex < chapter.sections.length - 1 ? "继续阅读" : "进入读后挑战"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
