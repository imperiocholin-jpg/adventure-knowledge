import { isPetProfileCompleted, isUserProfileSetupCompleted } from "@/lib/auth/onboarding"

type GenericRecord = Record<string, unknown>

/** 登录/注册后应跳转的路径 */
export function resolvePostAuthPath(options: {
  userRow: GenericRecord | null
  petRow: GenericRecord | null
  isReadoptFlow?: boolean
}) {
  if (options.isReadoptFlow) return "/auth/pet-setup?readopt=1"
  if (!isUserProfileSetupCompleted(options.userRow)) return "/auth/profile-setup"
  if (!isPetProfileCompleted(options.petRow)) return "/auth/pet-setup"
  return "/"
}
