"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { resolvePostAuthPath } from "@/lib/auth/resolve-post-auth-path"

type OnboardingPage = "profile-setup" | "pet-setup"

async function fetchOnboardingRows() {
  const [userResponse, petResponse] = await Promise.all([
    fetch("/api/users", { cache: "no-store" }),
    fetch("/api/pets", { cache: "no-store" }),
  ])
  const userPayload = await userResponse.json()
  const petPayload = await petResponse.json()
  const userRow = Array.isArray(userPayload?.data) ? (userPayload.data[0] as Record<string, unknown>) : null
  const petRow = Array.isArray(petPayload?.data) ? (petPayload.data[0] as Record<string, unknown>) : null
  return { userRow, petRow }
}

/** 已完成对应步骤时自动跳走，避免老用户重复填写注册表单 */
export function useOnboardingPageGuard(page: OnboardingPage, options?: { skip?: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (options?.skip) return

    let cancelled = false

    void (async () => {
      try {
        const { userRow, petRow } = await fetchOnboardingRows()
        if (cancelled) return

        const nextPath = resolvePostAuthPath({
          userRow,
          petRow,
          isReadoptFlow: false,
        })

        if (page === "profile-setup" && nextPath !== "/auth/profile-setup") {
          router.replace(nextPath)
          router.refresh()
          return
        }

        if (page === "pet-setup" && nextPath !== "/auth/pet-setup") {
          router.replace(nextPath)
          router.refresh()
        }
      } catch {
        // 未登录或网络异常时保持当前页，由 API 自行处理
      }
    })()

    return () => {
      cancelled = true
    }
  }, [options?.skip, page, router])
}
