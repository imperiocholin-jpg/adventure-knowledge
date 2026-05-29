"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function ProfileAccountPage() {
  const router = useRouter()
  const { profile } = useUserProfile()
  const [email, setEmail] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" })
        const payload = await response.json()
        if (response.ok && payload?.data?.user?.email) {
          setEmail(payload.data.user.email)
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const logout = async () => {
    if (!window.confirm("确定要退出登录吗？")) return
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth")
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  const displayEmail = email || profile.email || "—"

  return (
    <PlayerPageShell bottomPad="compact" className="bg-background">
      <PlayerStickyHeader className="border-border/40 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile" className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">账号与安全</h1>
        </div>
      </PlayerStickyHeader>

      <div className="space-y-4 px-4 py-5">
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">登录邮箱</p>
              <p className="truncate text-sm font-medium">{displayEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">账号状态</p>
              <p className="text-sm font-medium text-emerald-600">已登录</p>
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          修改密码、绑定微信等功能将在后续版本开放。如需帮助，请联系老师或管理员。
        </p>

        <Button
          variant="outline"
          className="w-full rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={isLoggingOut}
          onClick={() => void logout()}
        >
          {isLoggingOut ? "退出中..." : "退出登录"}
        </Button>
      </div>
    </PlayerPageShell>
  )
}
