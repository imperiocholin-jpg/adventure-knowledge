"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { resolvePostAuthPath } from "@/lib/auth/resolve-post-auth-path"

type AuthMode = "login" | "signup"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseApiError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback
  const message = (payload as { error?: { message?: unknown } }).error?.message
  if (typeof message !== "string" || !message) return fallback

  const lower = message.toLowerCase()
  if (lower.includes("email rate limit exceeded")) {
    return "注册太频繁了。若你刚刚注册过，请直接点“去登录”并使用同一账号密码。"
  }
  if (lower.includes("invalid login credentials")) {
    return "邮箱或密码不正确，请检查后重试。"
  }
  if (lower.includes("email not confirmed")) {
    return "邮箱尚未确认。系统正在自动处理，请稍后再点一次登录。"
  }
  if (lower.includes("signup succeeded but no active session returned")) {
    return "注册成功但未自动登录，请直接点击“去登录”。"
  }
  return message
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wechatNotice, setWechatNotice] = useState<string | null>(null)

  const handleWechatLogin = () => {
    setError(null)
    setWechatNotice("微信登录即将上线，请先使用邮箱注册或登录。")
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
    setWechatNotice(null)
  }

  const submitAuth = async () => {
    const trimmedEmail = email.trim()
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("请输入有效邮箱，例如 you@example.com")
      return
    }
    if (password.trim().length < 6) {
      setError("密码至少 6 位")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setWechatNotice(null)

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(parseApiError(payload, "认证失败，请重试"))
      }
      const [userResponse, petResponse] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/pets", { cache: "no-store" }),
      ])
      const userPayload = await userResponse.json()
      const petPayload = await petResponse.json()
      const userRow = Array.isArray(userPayload?.data) ? (userPayload.data[0] as Record<string, unknown>) : null
      const petRow = Array.isArray(petPayload?.data) ? (petPayload.data[0] as Record<string, unknown>) : null

      const nextPath = resolvePostAuthPath({
        userRow,
        petRow,
        isReadoptFlow: false,
      })
      router.push(nextPath)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "认证失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PlayerPageShell bottomPad="none" withGutter className="flex items-center justify-center bg-background py-4">
      <div className="w-full rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-card-foreground">邮箱账号</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login"
            ? "登录后自动同步你的阅读成长数据"
            : "注册后需设置昵称、头像并领养宠物"}
        </p>

        <div className="mt-4 flex rounded-xl bg-muted/50 p-1" role="tablist" aria-label="登录或注册">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchMode("signup")}
          >
            注册
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">邮箱</label>
            <input
              className="mt-1 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">密码</label>
            <input
              className="mt-1 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-rose-600">{error}</p>
            {mode === "login" && error.includes("不正确") ? (
              <p className="text-xs text-muted-foreground">
                还没有账号？请点上方「注册」标签，使用有效邮箱创建新账号。
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          className="mt-5 w-full rounded-xl"
          disabled={isSubmitting || !email.trim() || !password.trim()}
          onClick={submitAuth}
        >
          {isSubmitting ? "处理中..." : mode === "login" ? "登录" : "注册"}
        </Button>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/80" />
          <span className="text-xs text-muted-foreground">或</span>
          <div className="h-px flex-1 bg-border/80" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full rounded-xl border-border/60 bg-muted/50 text-muted-foreground shadow-none hover:bg-muted/70 hover:text-muted-foreground"
          disabled={isSubmitting}
          onClick={handleWechatLogin}
        >
          微信登录
        </Button>

        {wechatNotice ? (
          <p className="mt-2 text-center text-xs text-amber-700/90">{wechatNotice}</p>
        ) : null}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          {mode === "login" ? "没有账号？" : "已有账号？"}
          <button
            className="ml-1 text-primary"
            onClick={() => switchMode(mode === "login" ? "signup" : "login")}
            type="button"
          >
            {mode === "login" ? "切换到注册" : "切换到登录"}
          </button>
        </p>
      </div>
    </PlayerPageShell>
  )
}
