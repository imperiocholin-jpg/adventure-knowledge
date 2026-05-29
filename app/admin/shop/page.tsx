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
import type { PetShopCategory, PetShopItem } from "@/lib/pets/shop"

interface CategoryOption {
  id: string
  label: string
}

const CATEGORY_LABEL: Record<string, string> = {
  food: "食物",
  training: "训练",
  rest: "休息",
  toy: "玩具",
  equipment: "装备",
}

const EMPTY_FORM: PetShopItem = {
  id: "",
  name: "",
  category: "food",
  price: 10,
  icon: "📦",
  description: "",
  effect: { satiety: 0, spirit: 0, bond: 0 },
}

function formatEffect(effect: PetShopItem["effect"]) {
  const parts = [
    effect.satiety ? `饱食 +${effect.satiety}` : null,
    effect.spirit ? `精神 +${effect.spirit}` : null,
    effect.bond ? `亲密 +${effect.bond}` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : "—"
}

export default function AdminShopPage() {
  const [items, setItems] = useState<PetShopItem[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("edit")
  const [form, setForm] = useState<PetShopItem>(EMPTY_FORM)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== "all") params.set("category", categoryFilter)
      const response = await fetch(`/api/admin/shop/items?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载失败")
      setItems(payload.data.items as PetShopItem[])
      setCategories(payload.data.categories as CategoryOption[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败")
    } finally {
      setIsLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const filteredCount = useMemo(() => items.length, [items])

  const openCreate = () => {
    setEditorMode("create")
    setForm({ ...EMPTY_FORM, id: `item-${Date.now()}` })
    setEditorOpen(true)
    setMessage(null)
    setError(null)
  }

  const openEdit = (item: PetShopItem) => {
    setEditorMode("edit")
    setForm({
      ...item,
      effect: {
        satiety: item.effect.satiety ?? 0,
        spirit: item.effect.spirit ?? 0,
        bond: item.effect.bond ?? 0,
      },
    })
    setEditorOpen(true)
    setMessage(null)
    setError(null)
  }

  const saveItem = async () => {
    setIsSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/shop/items", {
        method: editorMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          effect: {
            satiety: Number(form.effect.satiety) || 0,
            spirit: Number(form.effect.spirit) || 0,
            bond: Number(form.effect.bond) || 0,
          },
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "保存失败")
      setMessage(editorMode === "create" ? "物品已新增" : "物品已更新")
      setEditorOpen(false)
      await loadItems()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteItem = async (item: PetShopItem) => {
    if (!window.confirm(`确定删除「${item.name}」吗？`)) return
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/shop/items?id=${encodeURIComponent(item.id)}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "删除失败")
      setMessage("物品已删除")
      await loadItems()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">商城管理</h2>
        <p className="text-sm text-slate-500">管理宠物商城物品：价格、功效、分类与描述</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          刷新
        </button>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          增加物品
        </button>
        <span className="text-sm text-slate-500">共 {filteredCount} 件物品</span>
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">物品</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">功效</th>
              <th className="px-4 py-3 font-medium">描述</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  暂无物品
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="font-mono text-xs text-slate-500">{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{CATEGORY_LABEL[item.category] ?? item.category}</td>
                  <td className="px-4 py-3 font-semibold text-amber-700">{item.price} 金币</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatEffect(item.effect)}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-500">{item.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEdit(item)} className="text-xs font-medium text-slate-900 hover:underline">
                        编辑
                      </button>
                      <button type="button" onClick={() => void deleteItem(item)} className="text-xs font-medium text-rose-600 hover:underline">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editorMode === "create" ? "新增物品" : "编辑物品"}</DialogTitle>
            <DialogDescription>调整价格、功效与其他基础信息，保存后立即对玩家端商城生效。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">ID</span>
              <input
                value={form.id}
                disabled={editorMode === "edit"}
                onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">名称</span>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">分类</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as PetShopCategory }))}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">价格（金币）</span>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">图标（emoji）</span>
              <input
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">饱食度</span>
                <input
                  type="number"
                  min={0}
                  value={form.effect.satiety ?? 0}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, effect: { ...prev.effect, satiety: Number(e.target.value) } }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">精神值</span>
                <input
                  type="number"
                  min={0}
                  value={form.effect.spirit ?? 0}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, effect: { ...prev.effect, spirit: Number(e.target.value) } }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-600">亲密值</span>
                <input
                  type="number"
                  min={0}
                  value={form.effect.bond ?? 0}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, effect: { ...prev.effect, bond: Number(e.target.value) } }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">描述</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <DialogFooter>
            <button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
              取消
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveItem()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSaving ? "保存中…" : "保存"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
