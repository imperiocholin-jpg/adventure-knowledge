"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"

import { BookCoverThumb } from "@/components/library/book-cover-thumb"

import { ADVENTURE_REGION_META } from "@/lib/library/adventure-regions"
import { GRADE_LABEL } from "@/lib/library/grade-region-map"

interface AdminBookItem {
  id: string
  title: string
  author: string
  cover: string
  coverImageSrc: string | null
  regionId: string
  regionName: string
  gradeLabel: string
  chapterCount: number
  contentAvailable: boolean
}

interface BookFilters {
  title: string
  grade: string
  regionId: string
  chapterCount: string
  status: string
}

const EMPTY_FILTERS: BookFilters = {
  title: "",
  grade: "",
  regionId: "",
  chapterCount: "",
  status: "",
}

const GRADE_OPTIONS = Object.entries(GRADE_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const REGION_OPTIONS = Object.values(ADVENTURE_REGION_META).map((region) => ({
  value: region.id,
  label: region.name,
}))

const filterSelectClass =
  "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-normal text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"

const headerCellClass = "px-3 py-2.5 text-center align-middle"
const headerLabelClass = "block text-center text-[11px] font-semibold tracking-wide text-slate-600"

function PlainHeader({ label, className = "" }: { label: string; className?: string }) {
  return (
    <th className={`${headerCellClass} ${className}`}>
      <span className={headerLabelClass}>{label}</span>
    </th>
  )
}

function FilterHeader({
  label,
  children,
  className = "",
}: {
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <th className={`${headerCellClass} align-top ${className}`}>
      <div className="flex flex-col items-center gap-1.5">
        <span className={headerLabelClass}>{label}</span>
        <div className="w-full min-w-[4.5rem]">{children}</div>
      </div>
    </th>
  )
}

export default function AdminBooksPage() {
  const [items, setItems] = useState<AdminBookItem[]>([])
  const [filters, setFilters] = useState<BookFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const pageSize = 30

  const loadBooks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filters.title.trim()) params.set("title", filters.title.trim())
      if (filters.grade) params.set("grade", filters.grade)
      if (filters.regionId) params.set("regionId", filters.regionId)
      if (filters.chapterCount) params.set("chapterCount", filters.chapterCount)
      if (filters.status) params.set("status", filters.status)

      const response = await fetch(`/api/admin/books?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载书籍失败")
      setItems(payload.data.items as AdminBookItem[])
      setTotal(payload.data.total as number)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载书籍失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  const updateFilter = (key: keyof BookFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasActiveFilters = Object.values(filters).some((value) => value.trim() !== "")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">书架管理</h2>
        <p className="text-sm text-slate-500">
          展示 book 目录全部书目（{total > 0 ? `${total} 本` : "加载中"}）；有章节内容的书显示实际章节数，其余为 0
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-medium text-slate-800">数据说明</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>数据源：`data/local-book-manifest.json`（扫描 `book/` 目录生成）</li>
          <li>章节数来自 `data/imported-books/chapters/`，未导入正文的书显示 0</li>
          <li>书封目录：`public/image/book-covers/`（推荐文件名 = 书名，如 `小巴掌童话.webp`；也支持书目 ID 命名）</li>
          <li>完整文件名清单：`data/book-covers/cover-slots.json`</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void loadBooks()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          刷新
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            清除筛选
          </button>
        ) : null}
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-xs">
            <tr>
              <PlainHeader label="封面" className="w-16" />
              <FilterHeader label="书名" className="min-w-[7rem]">
                <input
                  type="search"
                  value={filters.title}
                  onChange={(e) => updateFilter("title", e.target.value)}
                  placeholder="筛选书名"
                  className={filterSelectClass}
                />
              </FilterHeader>
              <PlainHeader label="作者" className="min-w-[5rem]" />
              <FilterHeader label="年级" className="min-w-[5.5rem]">
                <select
                  value={filters.grade}
                  onChange={(e) => updateFilter("grade", e.target.value)}
                  className={filterSelectClass}
                >
                  <option value="">全部</option>
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterHeader>
              <FilterHeader label="区域" className="min-w-[5.5rem]">
                <select
                  value={filters.regionId}
                  onChange={(e) => updateFilter("regionId", e.target.value)}
                  className={filterSelectClass}
                >
                  <option value="">全部</option>
                  {REGION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FilterHeader>
              <FilterHeader label="章节数" className="w-24">
                <select
                  value={filters.chapterCount}
                  onChange={(e) => updateFilter("chapterCount", e.target.value)}
                  className={filterSelectClass}
                >
                  <option value="">全部</option>
                  <option value="0">0 章</option>
                  <option value="gt0">有章节</option>
                </select>
              </FilterHeader>
              <FilterHeader label="状态" className="w-24">
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter("status", e.target.value)}
                  className={filterSelectClass}
                >
                  <option value="">全部</option>
                  <option value="available">可读</option>
                  <option value="pending">待导入</option>
                </select>
              </FilterHeader>
              <PlainHeader label="ID" className="min-w-[8rem]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {hasActiveFilters ? "没有符合筛选条件的书籍" : "暂无书籍数据"}
                </td>
              </tr>
            ) : (
              items.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <BookCoverThumb
                        bookId={book.id}
                        title={book.title}
                        emoji={book.cover}
                        imageSrc={book.coverImageSrc}
                        className="h-10 w-10"
                        sizes="40px"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-slate-900">{book.title}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{book.author}</td>
                  <td className="px-3 py-3 text-center text-xs">{book.gradeLabel}</td>
                  <td className="px-3 py-3 text-center text-xs">{book.regionName}</td>
                  <td className="px-3 py-3 text-center">{book.chapterCount}</td>
                  <td className="px-3 py-3 text-center">
                    {book.contentAvailable ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">可读</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">待导入</span>
                    )}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-3 text-center font-mono text-xs text-slate-500" title={book.id}>
                    {book.id}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          共 {total} 条 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
