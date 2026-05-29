"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface QuestionItem {
  id: string
  bookId: string
  chapterId: string
  regionId: string | null
  questionType: string
  prompt: string
  options: string[]
  answerIndex: number | null
  answerText: string
  answerRubric: string[]
  successResponse: string
  retryResponse: string
  sourceLabel: string
  sourceExcerpt: string
  difficulty: number
  status: string
  reviewer: string | null
  reviewNotes: string
}

const STATUS_OPTIONS = [
  { id: "draft", label: "待审核" },
  { id: "approved", label: "已通过" },
  { id: "needs_rewrite", label: "需改写" },
  { id: "rejected", label: "已驳回" },
  { id: "published", label: "已发布" },
  { id: "all", label: "全部" },
]

const TYPE_LABEL: Record<string, string> = {
  memory: "记忆互动",
  plot_choice: "剧情选择",
  npc_dialogue: "NPC 对话",
}

function statusClass(status: string) {
  if (status === "approved" || status === "published") return "bg-emerald-100 text-emerald-700"
  if (status === "needs_rewrite") return "bg-amber-100 text-amber-700"
  if (status === "rejected") return "bg-rose-100 text-rose-700"
  return "bg-slate-100 text-slate-600"
}

function toLines(value: string[]) {
  return value.join("\n")
}

function fromLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionItem[]>([])
  const [status, setStatus] = useState("draft")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isBulkApproving, setIsBulkApproving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<QuestionItem | null>(null)
  const [form, setForm] = useState({
    prompt: "",
    optionsText: "",
    answerIndex: "",
    answerText: "",
    answerRubricText: "",
    successResponse: "",
    retryResponse: "",
    sourceExcerpt: "",
    difficulty: 1,
    reviewNotes: "",
  })

  const pageSize = 30
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) })
      if (q.trim()) params.set("q", q.trim())
      const response = await fetch(`/api/admin/questions?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载题目失败")
      setItems(payload.data.items as QuestionItem[])
      setTotal(payload.data.total as number)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载题目失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, q, status])

  useEffect(() => {
    void loadQuestions()
  }, [loadQuestions])

  const countsLabel = useMemo(() => `共 ${total} 道 · 第 ${page} / ${totalPages} 页`, [page, total, totalPages])

  const openEditor = (item: QuestionItem) => {
    setEditing(item)
    setForm({
      prompt: item.prompt,
      optionsText: toLines(item.options),
      answerIndex: item.answerIndex === null ? "" : String(item.answerIndex),
      answerText: item.answerText,
      answerRubricText: toLines(item.answerRubric),
      successResponse: item.successResponse,
      retryResponse: item.retryResponse,
      sourceExcerpt: item.sourceExcerpt,
      difficulty: item.difficulty,
      reviewNotes: item.reviewNotes,
    })
    setEditorOpen(true)
    setError(null)
    setMessage(null)
  }

  const patchQuestion = async (id: string, patch: Record<string, unknown>) => {
    const response = await fetch("/api/admin/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload?.error?.message ?? "保存失败")
    return payload.data.item as QuestionItem
  }

  const updateStatus = async (item: QuestionItem, nextStatus: string) => {
    setError(null)
    setMessage(null)
    try {
      await patchQuestion(item.id, { status: nextStatus })
      setMessage("状态已更新")
      await loadQuestions()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败")
    }
  }

  const approveCurrentPage = async () => {
    const candidates = items.filter((item) => item.status !== "approved" && item.status !== "published")
    if (candidates.length === 0) {
      setMessage("当前页没有需要通过的题目")
      return
    }
    if (!window.confirm(`确认将当前页 ${candidates.length} 道题全部标记为通过吗？`)) return

    setIsBulkApproving(true)
    setError(null)
    setMessage(null)
    try {
      for (const item of candidates) {
        await patchQuestion(item.id, { status: "approved" })
      }
      setMessage(`当前页 ${candidates.length} 道题已通过`)
      await loadQuestions()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "一键通过失败")
    } finally {
      setIsBulkApproving(false)
    }
  }

  const saveEditor = async (nextStatus?: string) => {
    if (!editing) return
    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      await patchQuestion(editing.id, {
        prompt: form.prompt,
        options: fromLines(form.optionsText),
        answerIndex: form.answerIndex.trim() === "" ? null : Number(form.answerIndex),
        answerText: form.answerText,
        answerRubric: fromLines(form.answerRubricText),
        successResponse: form.successResponse,
        retryResponse: form.retryResponse,
        sourceExcerpt: form.sourceExcerpt,
        difficulty: Number(form.difficulty),
        reviewNotes: form.reviewNotes,
        ...(nextStatus ? { status: nextStatus } : {}),
      })
      setEditorOpen(false)
      setMessage(nextStatus ? "题目已审核" : "题目已保存")
      await loadQuestions()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">题库审核</h2>
        <p className="text-sm text-slate-500">审核阅读冒险题目，确认题源、题干、答案与反馈后再发布给前台使用</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-800">审核规则</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>题目必须能从题源原文中找到依据</li>
          <li>题干要像冒险互动，不要像考试卷</li>
          <li>选项和答案要明确，反馈要温和</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={q}
          onChange={(event) => {
            setQ(event.target.value)
            setPage(1)
          }}
          placeholder="搜索题干、题源、书籍 ID..."
          className="min-w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void loadQuestions()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          刷新
        </button>
        <button
          type="button"
          disabled={isBulkApproving || items.length === 0}
          onClick={() => void approveCurrentPage()}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isBulkApproving ? "通过中..." : "本页一键通过"}
        </button>
        <span className="text-sm text-slate-500">{countsLabel}</span>
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">题目</th>
              <th className="px-4 py-3 font-medium">题源</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  加载中...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无题目
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-slate-50/80">
                  <td className="max-w-md px-4 py-3">
                    <p className="font-medium leading-6 text-slate-900">{item.prompt}</p>
                    {item.options.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">选项：{item.options.join(" / ")}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">开放题：{item.answerText}</p>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{item.sourceLabel}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.sourceExcerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{TYPE_LABEL[item.questionType] ?? item.questionType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEditor(item)} className="text-xs font-medium text-slate-900 hover:underline">
                        编辑
                      </button>
                      <button type="button" onClick={() => void updateStatus(item, "approved")} className="text-xs font-medium text-emerald-700 hover:underline">
                        通过
                      </button>
                      <button type="button" onClick={() => void updateStatus(item, "needs_rewrite")} className="text-xs font-medium text-amber-700 hover:underline">
                        需改写
                      </button>
                      <button type="button" onClick={() => void updateStatus(item, "rejected")} className="text-xs font-medium text-rose-700 hover:underline">
                        驳回
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{countsLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑题目</DialogTitle>
            <DialogDescription>{editing?.sourceLabel}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">题干</span>
              <textarea
                value={form.prompt}
                onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">选项（每行一个；开放题可留空）</span>
              <textarea
                value={form.optionsText}
                onChange={(event) => setForm((prev) => ({ ...prev, optionsText: event.target.value }))}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">正确选项序号（0 开始；开放题留空）</span>
                <input
                  value={form.answerIndex}
                  onChange={(event) => setForm((prev) => ({ ...prev, answerIndex: event.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">难度 1-5</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.difficulty}
                  onChange={(event) => setForm((prev) => ({ ...prev, difficulty: Number(event.target.value) }))}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">答案说明</span>
              <input
                value={form.answerText}
                onChange={(event) => setForm((prev) => ({ ...prev, answerText: event.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">开放题评分规则（每行一个）</span>
              <textarea
                value={form.answerRubricText}
                onChange={(event) => setForm((prev) => ({ ...prev, answerRubricText: event.target.value }))}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">答对反馈</span>
                <textarea
                  value={form.successResponse}
                  onChange={(event) => setForm((prev) => ({ ...prev, successResponse: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">重试提示</span>
                <textarea
                  value={form.retryResponse}
                  onChange={(event) => setForm((prev) => ({ ...prev, retryResponse: event.target.value }))}
                  rows={3}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">题源原文</span>
              <textarea
                value={form.sourceExcerpt}
                onChange={(event) => setForm((prev) => ({ ...prev, sourceExcerpt: event.target.value }))}
                rows={4}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">审核备注</span>
              <textarea
                value={form.reviewNotes}
                onChange={(event) => setForm((prev) => ({ ...prev, reviewNotes: event.target.value }))}
                rows={2}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
              取消
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveEditor()}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              保存
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveEditor("needs_rewrite")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              需改写
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveEditor("rejected")}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              驳回
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveEditor("approved")}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              通过
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
