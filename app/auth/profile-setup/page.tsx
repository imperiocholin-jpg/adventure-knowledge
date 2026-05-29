"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { PlayerPageShell } from "@/components/layout/player-page-shell"
import { UserAvatarPicker } from "@/components/user/user-avatar-picker"
import { DEFAULT_USER_AVATAR_ID } from "@/lib/user/avatar-catalog"
import { useOnboardingPageGuard } from "@/hooks/use-onboarding-page-guard"
import { writeLocalUserProfilePatch } from "@/lib/user/user-profile"

export default function ProfileSetupPage() {
  const router = useRouter()
  useOnboardingPageGuard("profile-setup")
  const [username, setUsername] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [gradeClass, setGradeClass] = useState("")
  const [age, setAge] = useState("")
  const [avatarId, setAvatarId] = useState(DEFAULT_USER_AVATAR_ID)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitProfile = async () => {
    const trimmed = username.trim().slice(0, 20)
    if (trimmed.length < 2) {
      setError("昵称至少 2 个字")
      return
    }
    if (schoolName.trim().length < 2) {
      setError("请填写就读学校")
      return
    }
    if (gradeClass.trim().length < 2) {
      setError("请填写年级班级")
      return
    }
    const ageNum = Number(age)
    if (!Number.isFinite(ageNum) || ageNum < 5 || ageNum > 18) {
      setError("年龄请填写 5～18 岁")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/users/profile-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmed,
          avatarId,
          schoolName: schoolName.trim(),
          gradeClass: gradeClass.trim(),
          age: ageNum,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message ?? "保存失败，请重试")
      }

      writeLocalUserProfilePatch({ username: trimmed, avatarId })
      router.push("/auth/pet-setup")
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "保存失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    username.trim().length >= 2 &&
    schoolName.trim().length >= 2 &&
    gradeClass.trim().length >= 2 &&
    Number(age) >= 5 &&
    Number(age) <= 18

  return (
    <PlayerPageShell bottomPad="none" withGutter className="bg-background py-6">
      <div className="space-y-4">
        <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground">第 1 步 / 共 2 步</p>
          <h1 className="mt-1 text-xl font-bold">创建冒险家身份</h1>
          <p className="mt-1 text-sm text-muted-foreground">填写基本信息并选择头像，下一步再选择宠物伙伴。</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">冒险家昵称</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="例如：小冒险家"
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">就读学校</label>
              <input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                maxLength={60}
                placeholder="例如：实验小学"
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">年级班级</label>
              <input
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                maxLength={30}
                placeholder="例如：三年级2班"
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">年龄</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                inputMode="numeric"
                placeholder="5～18 岁"
                className="mt-1.5 w-full rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <UserAvatarPicker
          currentAvatarId={avatarId}
          persistOnSelect={false}
          onSelected={(id) => setAvatarId(id)}
        />

        {error ? <p className="text-center text-xs text-rose-600">{error}</p> : null}

        <Button
          className="w-full rounded-xl py-6 text-base font-bold"
          disabled={isSubmitting || !canSubmit}
          onClick={() => void submitProfile()}
        >
          {isSubmitting ? "保存中..." : "下一步：选择宠物"}
        </Button>
      </div>
    </PlayerPageShell>
  )
}
