import { findExistingColumn } from "@/lib/data/schema-compat"

export async function writeAdminAuditLog(
  serviceClient: any,
  params: {
    adminUserId: string
    action: string
    targetType: string
    targetId: string
    payload?: Record<string, unknown>
  },
) {
  const probe = await serviceClient.from("admin_audit_log").select("id").limit(1)
  if (probe.error) {
    console.warn("[admin_audit_log] table unavailable:", probe.error.message)
    return
  }

  await serviceClient.from("admin_audit_log").insert({
    admin_user_id: params.adminUserId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    payload: params.payload ?? {},
  })
}

export async function resolveUserRole(serviceClient: any, userId: string): Promise<string | null> {
  const ownerField = await findExistingColumn(serviceClient, "users", ["id", "user_id", "uid", "auth_user_id"])
  const roleField = await findExistingColumn(serviceClient, "users", ["role"])
  if (!ownerField || !roleField) return null

  const result = await serviceClient.from("users").select("*").eq(ownerField, userId).limit(1).maybeSingle()
  if (result.error || !result.data) return null
  const role = result.data[roleField]
  return typeof role === "string" ? role : null
}

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false
  const raw = process.env.ADMIN_EMAILS ?? process.env.BOOTSTRAP_ADMIN_EMAIL ?? ""
  const allowed = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) return false
  return allowed.includes(email.trim().toLowerCase())
}
