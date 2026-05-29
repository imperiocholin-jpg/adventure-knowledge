"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserAvatarPicker } from "@/components/user/user-avatar-picker"
import { PlayerPageShell, PlayerStickyHeader } from "@/components/layout/player-page-shell"
import {
  notifyUserProfileUpdated,
  saveUserProfileToServer,
  writeLocalUserProfilePatch,
} from "@/lib/user/user-profile"
import { useUserProfile } from "@/hooks/use-user-profile"

export default function ProfileEditPage() {
  const router = useRouter()
  const { profile, isLoading, refresh } = useUserProfile()
  const [username, setUsername] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [gradeClass, setGradeClass] = useState("")
  const [age, setAge] = useState("")
  const [avatarId, setAvatarId] = useState(profile.avatarId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    setUsername(profile.username)
    setSchoolName(profile.schoolName ?? "")
    setGradeClass(profile.gradeClass ?? "")
    setAge(profile.age ? String(profile.age) : "")
    setAvatarId(profile.avatarId)
  }, [isLoading, profile])

  const submit = async () => {
    const trimmed = username.trim().slice(0, 20)
    if (trimmed.length < 2) {
      setError("昵称至少 2 个字")
      return
    }
    if (schoolName.trim() && schoolName.trim().length < 2) {
      setError("学校名称至少 2 个字")
      return
    }
    if (gradeClass.trim() && gradeClass.trim().length < 2) {
      setError("年级班级至少 2 个字")
      return
    }
    const ageNum = age.trim() ? Number(age) : undefined
    if (age.trim() && (!Number.isFinite(ageNum) || ageNum! < 5 || ageNum! > 18)) {
      setError("年龄请填写 5～18 岁")
      return
    }

    setIsSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const ok = await saveUserProfileToServer({
        avatarId,
        username: trimmed,
        schoolName: schoolName.trim() || "",
        gradeClass: gradeClass.trim() || "",
        ...(ageNum !== undefined ? { age: ageNum } : {}),
      })
      if (!ok) throw new Error("保存失败，请重试")

      writeLocalUserProfilePatch({ username: trimmed, avatarId })
      notifyUserProfileUpdated()
      await refresh()
      setMessage("资料已保存")
      setTimeout(() => router.push("/profile"), 600)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PlayerPageShell bottomPad="compact" className="bg-background">
      <PlayerStickyHeader className="border-border/40 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile" className="rounded-full p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">编辑资料</h1>
        </div>
      </PlayerStickyHeader>

      <div className="space-y-4 px-4 py-5">
        <UserAvatarPicker
          currentAvatarId={avatarId}
          persistOnSelect={false}
          onSelected={(id) => setAvatarId(id)}
        />

        <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
          <label className="block text-sm">
            <span className="font-medium">冒险家昵称</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">就读学校</span>
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              maxLength={60}
              placeholder="例如：实验小学"
              className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">年级班级</span>
            <input
              value={gradeClass}
              onChange={(e) => setGradeClass(e.target.value)}
              maxLength={30}
              placeholder="例如：三年级2班"
              className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">年龄</span>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
              inputMode="numeric"
              placeholder="5～18 岁"
              className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </label>
        </div>

        {error ? <p className="text-center text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-center text-sm text-emerald-600">{message}</p> : null}

        <Button
          className="w-full rounded-xl py-6 text-base font-bold"
          disabled={isSubmitting || isLoading}
          onClick={() => void submit()}
        >
          {isSubmitting ? "保存中..." : "保存资料"}
        </Button>
      </div>
    </PlayerPageShell>
  )
}
