"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface Stats {
  totalUsers: number
  activeToday: number
  readingToday: number
  deadPets: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" })
        const sessionPayload = await sessionRes.json()
        if (sessionPayload?.user?.email) {
          setLoginEmail(sessionPayload.user.email as string)
        }

        const response = await fetch("/api/admin/stats", { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "加载统计失败")
        }
        setStats(payload.data as Stats)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载统计失败")
      }
    })()
  }, [])

  const cards = [
    { label: "注册用户", value: stats?.totalUsers ?? "—" },
    { label: "今日活跃", value: stats?.activeToday ?? "—" },
    { label: "今日阅读/挑战", value: stats?.readingToday ?? "—" },
    { label: "死亡宠物", value: stats?.deadPets ?? "—" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">总览</h2>
        <p className="text-sm text-slate-500">小范围试用（200 账号）运营看板</p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 space-y-1">
          <p>{error}</p>
          {loginEmail && (
            <p>
              当前登录：<strong>{loginEmail}</strong>。请确认 Supabase 里该邮箱的 <code className="text-xs">role=admin</code>，或{" "}
              <code className="text-xs">.env.local</code> 的 <code className="text-xs">BOOTSTRAP_ADMIN_EMAIL</code> 与此一致后重启 dev。
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-medium">快捷入口</h3>
        <p className="mt-1 text-sm text-slate-500">查看每个用户的使用情况并调整数值</p>
        <Link
          href="/admin/users"
          className="mt-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          进入用户列表
        </Link>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">首次使用</p>
        <p className="mt-1">
          需在 Supabase 执行迁移 <code className="text-xs">20260601000000_admin_role_and_audit.sql</code>，并将你的账号设为 admin：
          <code className="mt-1 block text-xs">update public.users set role = &apos;admin&apos; where email = &apos;你的邮箱&apos;;</code>
        </p>
      </div>
    </div>
  )
}
