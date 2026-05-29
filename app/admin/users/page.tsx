"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

interface UserItem {
  id: string
  email: string
  nickname: string
  schoolName: string | null
  gradeClass: string | null
  age: number | null
  coins: number
  level: number
  dailyStreak: number
  lastActiveDate: string | null
  createdAt: string | null
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserItem[]>([])
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isBatchCreating, setIsBatchCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [gradeClass, setGradeClass] = useState("")
  const [age, setAge] = useState("")

  const pageSize = 20

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (q.trim()) params.set("q", q.trim())
      const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "加载用户失败")
      setItems(payload.data.items as UserItem[])
      setTotal(payload.data.total as number)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载用户失败")
    } finally {
      setIsLoading(false)
    }
  }, [page, q])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers, reloadKey])

  const createUser = async () => {
    setIsCreating(true)
    setError(null)
    setMessage(null)
    try {
      const body: Record<string, unknown> = {
        email: email.trim(),
        password,
      }
      if (nickname.trim()) body.nickname = nickname.trim()
      if (schoolName.trim()) body.schoolName = schoolName.trim()
      if (gradeClass.trim()) body.gradeClass = gradeClass.trim()
      if (age.trim()) body.age = Number(age)

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "创建失败")

      setMessage(`已创建马甲账号：${payload.data?.email || email}`)
      setEmail("")
      setPassword("")
      setNickname("")
      setSchoolName("")
      setGradeClass("")
      setAge("")
      setShowCreate(false)
      setPage(1)
      setReloadKey((k) => k + 1)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "创建失败")
    } finally {
      setIsCreating(false)
    }
  }

  const batchCreateXiamen = async () => {
    if (!window.confirm("将批量创建 10 个厦门小学马甲账号，默认密码 Test123456。继续？")) return
    setIsBatchCreating(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch("/api/admin/users/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10, preset: "xiamen", password: "Test123456" }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "批量创建失败")
      const created = (payload.data?.created ?? []) as Array<{ nickname: string; email: string }>
      const failed = (payload.data?.failed ?? []) as Array<{ email: string; error: string }>
      setMessage(
        `已创建 ${created.length} 个马甲${failed.length > 0 ? `，失败 ${failed.length} 个` : ""}。默认密码：Test123456`,
      )
      setPage(1)
      setReloadKey((k) => k + 1)
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : "批量创建失败")
    } finally {
      setIsBatchCreating(false)
    }
  }

  const deleteUser = async (user: UserItem) => {
    const label = user.email || user.nickname || user.id
    if (!window.confirm(`确定删除账号「${label}」？\n将同时删除其宠物、阅读记录等数据，且不可恢复。`)) {
      return
    }

    setDeletingId(user.id)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? "删除失败")
      setMessage(`已删除：${label}`)
      setReloadKey((k) => k + 1)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "删除失败")
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canCreate = email.trim().includes("@") && password.length >= 6

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">用户管理</h2>
          <p className="text-sm text-slate-500">共 {total} 个账号 · 可新增测试马甲</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            {showCreate ? "收起表单" : "新增马甲"}
          </button>
          <button
            type="button"
            disabled={isBatchCreating}
            onClick={() => void batchCreateXiamen()}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
          >
            {isBatchCreating ? "创建中…" : "批量生成厦门马甲×10"}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium">新增马甲账号</h3>
          <p className="mt-1 text-xs text-slate-500">
            创建后可用邮箱密码直接登录。若填写完整学校/班级/年龄，将跳过资料填写步。
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="text-slate-500">邮箱 *</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test001@example.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">密码 *（至少 6 位）</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">昵称</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="不填则用邮箱前缀"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">学校</span>
              <input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">年级班级</span>
              <input
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="三年级2班"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">年龄</span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                placeholder="5～18"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!canCreate || isCreating}
            onClick={() => void createUser()}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isCreating ? "创建中…" : "确认创建"}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(event) => {
            setPage(1)
            setQ(event.target.value)
          }}
          placeholder="搜索邮箱、昵称、学校或班级"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-3">昵称</th>
              <th className="px-3 py-3">邮箱</th>
              <th className="px-3 py-3">学校</th>
              <th className="px-3 py-3">年级班级</th>
              <th className="px-3 py-3">年龄</th>
              <th className="px-3 py-3">连续天</th>
              <th className="px-3 py-3">金币</th>
              <th className="px-3 py-3">最近活跃</th>
              <th className="px-3 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  暂无用户
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-medium text-slate-900 hover:underline">
                      {user.nickname}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate" title={user.email}>
                    {user.email || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{user.schoolName || "—"}</td>
                  <td className="px-3 py-3 text-slate-600">{user.gradeClass || "—"}</td>
                  <td className="px-3 py-3">{user.age ?? "—"}</td>
                  <td className="px-3 py-3">{user.dailyStreak}</td>
                  <td className="px-3 py-3">{user.coins}</td>
                  <td className="px-3 py-3 text-slate-500">{user.lastActiveDate ?? "—"}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      disabled={deletingId === user.id}
                      onClick={() => void deleteUser(user)}
                      className="text-rose-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === user.id ? "删除中…" : "删除"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        >
          上一页
        </button>
        <span className="text-slate-500">
          第 {page} / {totalPages} 页
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </div>
  )
}
