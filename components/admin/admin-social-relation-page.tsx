"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import type { AdminSocialUserCard } from "@/lib/admin/user-social"

interface AdminSocialRelationPageProps {
  kind: "following" | "followers"
}

export function AdminSocialRelationPage({ kind }: AdminSocialRelationPageProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const [list, setList] = useState<AdminSocialUserCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const title = kind === "following" ? "关注列表" : "粉丝列表"
  const apiPath = kind === "following" ? "following" : "followers"
  const emptyText = kind === "following" ? "暂无关注" : "暂无粉丝"

  useEffect(() => {
    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/users/${userId}/${apiPath}`, { cache: "no-store" })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error?.message ?? "加载失败")
        setList((payload.data?.list ?? []) as AdminSocialUserCard[])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "加载失败")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [userId, apiPath])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/users/${userId}`}
          className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-slate-500">共 {list.length} 人</p>
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">加载中…</p>
        ) : list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((user) => (
              <li key={user.userId}>
                <Link
                  href={`/admin/users/${user.userId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <img
                    src={user.avatarSrc}
                    alt={user.username}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{user.username}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[user.schoolName, user.gradeClass].filter(Boolean).join(" · ") || user.email || user.userId}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{user.score} 胜</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
