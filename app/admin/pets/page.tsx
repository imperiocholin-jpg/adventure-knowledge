"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PetSpecies } from "@/lib/pets/catalog"

interface PetTypeRow {
  id: string
  label: string
  species: PetSpecies
  speciesLabel: string
  emoji: string
  source: "builtin" | "custom"
  disabled: boolean
}

interface StageAssetStatus {
  stage: string
  imagePath: string | null
  imageOk: boolean
  videosConfigured: boolean
  videoComplete: boolean
}

interface PetTypeAssetReport {
  id: string
  imageComplete: boolean
  videoComplete: boolean
  videoStatus: "complete" | "missing" | "not_configured"
  overallComplete: boolean
  stages: StageAssetStatus[]
}

const SPECIES_OPTIONS: Array<{ id: PetSpecies; label: string }> = [
  { id: "dog", label: "狗" },
  { id: "cat", label: "猫" },
  { id: "rabbit", label: "兔" },
  { id: "hamster", label: "鼠" },
  { id: "bird", label: "鸟" },
  { id: "pig", label: "猪" },
  { id: "turtle", label: "龟" },
  { id: "lizard", label: "蜥蜴" },
]

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700"
          : "inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700"
      }
    >
      {label}
    </span>
  )
}

function VideoStatusBadge({ status }: { status: PetTypeAssetReport["videoStatus"] | undefined }) {
  if (status === "complete") {
    return <StatusBadge ok label="完整" />
  }
  if (status === "missing") {
    return <StatusBadge ok={false} label="缺失" />
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
      无视频
    </span>
  )
}

export default function AdminPetsPage() {
  const [types, setTypes] = useState<PetTypeRow[]>([])
  const [assets, setAssets] = useState<PetTypeAssetReport[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    id: "",
    label: "",
    breed: "",
    species: "dog" as PetSpecies,
    emoji: "🐾",
    imagePrefix: "",
    videoDir: "",
    videoPrefix: "",
  })

  const assetMap = useMemo(() => new Map(assets.map((item) => [item.id, item])), [assets])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/pet-types", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载失败")
      setTypes(payload.data.types as PetTypeRow[])
      setAssets(payload.data.assets as PetTypeAssetReport[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const visibleTypes = types.filter((type) => !type.disabled)

  const createPetType = async () => {
    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/pet-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id.trim(),
          label: form.label.trim(),
          breed: form.breed.trim() || form.label.trim(),
          species: form.species,
          emoji: form.emoji.trim() || "🐾",
          imagePrefix: form.imagePrefix.trim() || undefined,
          videoDir: form.videoDir.trim() || undefined,
          videoPrefix: form.videoPrefix.trim() || undefined,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "新增失败")
      setMessage("宠物类型已新增")
      setCreateOpen(false)
      setForm({ id: "", label: "", breed: "", species: "dog", emoji: "🐾", imagePrefix: "", videoDir: "", videoPrefix: "" })
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "新增失败")
    } finally {
      setIsSaving(false)
    }
  }

  const removePetType = async (type: PetTypeRow) => {
    if (!window.confirm(`确定${type.source === "custom" ? "删除" : "停用"}「${type.label}」吗？`)) return
    setError(null)
    setMessage(null)
    try {
      const params = new URLSearchParams({ id: type.id, source: type.source })
      const response = await fetch(`/api/admin/pet-types?${params.toString()}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "操作失败")
      setMessage(type.source === "custom" ? "已删除自定义类型" : "已停用内置类型")
      await loadData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "操作失败")
    }
  }

  const restorePetType = async (type: PetTypeRow) => {
    setError(null)
    try {
      const response = await fetch("/api/admin/pet-types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: type.id, action: "restore" }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "恢复失败")
      setMessage(`已恢复「${type.label}」`)
      await loadData()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "恢复失败")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">宠物管理</h2>
        <p className="text-sm text-slate-500">管理宠物类型，检查各阶段图片/视频素材是否完整</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-800">素材路径约定</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>图片：`public/image/pets/{`{species}`}/{`{Prefix}`}-1/2/3.png`（幼崽/成年/壮年）</li>
          <li>视频：`public/video/pets/{`{species}`}/{`{Dir}`}/{`{Prefix}`}-1-happy.mp4` 等动作文件</li>
          <li>扫描基于 `avatar-registry` 规则；缺失文件会标红</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          重新扫描素材
        </button>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          新增宠物类型
        </button>
        <span className="text-sm text-slate-500">启用 {visibleTypes.length} / 总计 {types.length} 种</span>
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">物种</th>
              <th className="px-4 py-3 font-medium">图片</th>
              <th className="px-4 py-3 font-medium">视频</th>
              <th className="px-4 py-3 font-medium">整体</th>
              <th className="px-4 py-3 font-medium">来源</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  扫描中…
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  暂无宠物类型
                </td>
              </tr>
            ) : (
              types.map((type) => {
                const report = assetMap.get(type.id)
                const expanded = expandedId === type.id
                return (
                  <Fragment key={type.id}>
                    <tr className={type.disabled ? "bg-slate-50/80 opacity-60" : "hover:bg-slate-50/80"}>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={() => setExpandedId(expanded ? null : type.id)}
                        >
                          <span className="text-lg">{type.emoji}</span>
                          <div>
                            <p className="font-medium text-slate-900">{type.label}</p>
                            <p className="font-mono text-xs text-slate-500">{type.id}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">{type.speciesLabel}</td>
                      <td className="px-4 py-3">
                        <StatusBadge ok={Boolean(report?.imageComplete)} label={report?.imageComplete ? "完整" : "缺失"} />
                      </td>
                      <td className="px-4 py-3">
                        <VideoStatusBadge status={report?.videoStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge ok={Boolean(report?.overallComplete)} label={report?.overallComplete ? "就绪" : "待补"} />
                      </td>
                      <td className="px-4 py-3 text-xs">{type.source === "custom" ? "自定义" : "内置"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          {type.disabled ? (
                            <button type="button" onClick={() => void restorePetType(type)} className="text-xs font-medium text-emerald-700 hover:underline">
                              恢复
                            </button>
                          ) : (
                            <button type="button" onClick={() => void removePetType(type)} className="text-xs font-medium text-rose-600 hover:underline">
                              {type.source === "custom" ? "删除" : "停用"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded && report ? (
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-3">
                            {report.stages.map((stage) => (
                              <div key={stage.stage} className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                                <p className="font-semibold text-slate-800">{stage.stage}</p>
                                <p className="mt-2 text-slate-600">
                                  图片：{stage.imageOk ? "✓" : "✗"}{" "}
                                  <span className="break-all text-slate-400">{stage.imagePath ?? "—"}</span>
                                </p>
                                <p className="mt-1 text-slate-600">
                                  视频：{stage.videosConfigured ? (stage.videoComplete ? "完整" : "缺失") : "未配置"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增宠物类型</DialogTitle>
            <DialogDescription>添加后请将对应阶段图片/视频放入 public 目录，再点击「重新扫描素材」验证。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">类型 ID（英文）</span>
              <input
                value={form.id}
                onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                placeholder="例如 goldenRetriever"
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">显示名称</span>
              <input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">品种名（用于素材匹配）</span>
              <input
                value={form.breed}
                onChange={(e) => setForm((prev) => ({ ...prev, breed: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">物种</span>
              <select
                value={form.species}
                onChange={(e) => setForm((prev) => ({ ...prev, species: e.target.value as PetSpecies }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                {SPECIES_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Emoji</span>
              <input
                value={form.emoji}
                onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
              取消
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void createPetType()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "提交中…" : "新增"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
