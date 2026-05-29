import type { NotificationCategory } from "@/lib/notifications/types"
import { MAX_NOTIFICATIONS_LIST } from "@/lib/notifications/rules"

type GenericRecord = Record<string, unknown>

export interface CreateNotificationInput {
  userId: string
  category: NotificationCategory
  ruleKey: string
  title: string
  body: string
  href?: string
  dedupeKey?: string
  payload?: Record<string, unknown>
}

let tableAvailable: boolean | null = null

export async function isNotificationsTableAvailable(serviceClient: any): Promise<boolean> {
  if (tableAvailable !== null) return tableAvailable
  const probe = await serviceClient.from("user_notifications").select("id").limit(1)
  tableAvailable = !probe.error
  if (!tableAvailable) {
    console.warn("[user_notifications] table unavailable:", probe.error?.message)
  }
  return tableAvailable
}

export async function createNotificationIfAbsent(
  serviceClient: any,
  input: CreateNotificationInput,
): Promise<{ created: boolean; id?: string }> {
  if (!(await isNotificationsTableAvailable(serviceClient))) {
    return { created: false }
  }

  if (input.dedupeKey) {
    const existing = await serviceClient
      .from("user_notifications")
      .select("id")
      .eq("user_id", input.userId)
      .eq("dedupe_key", input.dedupeKey)
      .limit(1)
      .maybeSingle()

    if (!existing.error && existing.data) {
      return { created: false, id: String((existing.data as GenericRecord).id ?? "") }
    }
  }

  const insertResult = await serviceClient
    .from("user_notifications")
    .insert({
      user_id: input.userId,
      category: input.category,
      rule_key: input.ruleKey,
      dedupe_key: input.dedupeKey ?? null,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      payload: input.payload ?? {},
    })
    .select("id")
    .limit(1)

  if (insertResult.error) {
    console.warn("[user_notifications] insert failed:", insertResult.error.message)
    return { created: false }
  }

  const id = insertResult.data?.[0]?.id
  return { created: true, id: typeof id === "string" ? id : undefined }
}

function mapNotificationRow(row: GenericRecord) {
  return {
    id: String(row.id ?? ""),
    category: String(row.category ?? "system") as NotificationCategory,
    ruleKey: String(row.rule_key ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    href: typeof row.href === "string" ? row.href : undefined,
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : {},
    readAt: typeof row.read_at === "string" ? row.read_at : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  }
}

export async function listUserNotifications(serviceClient: any, userId: string) {
  if (!(await isNotificationsTableAvailable(serviceClient))) {
    return { items: [], unreadCount: 0 }
  }

  const result = await serviceClient
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_NOTIFICATIONS_LIST)

  if (result.error || !Array.isArray(result.data)) {
    console.warn("[user_notifications] list failed:", result.error?.message)
    return { items: [], unreadCount: 0 }
  }

  const items = (result.data as GenericRecord[]).map(mapNotificationRow)
  const unreadCount = items.filter((item) => !item.readAt).length
  return { items, unreadCount }
}

export async function markNotificationRead(serviceClient: any, userId: string, notificationId: string) {
  if (!(await isNotificationsTableAvailable(serviceClient))) return false

  const now = new Date().toISOString()
  const result = await serviceClient
    .from("user_notifications")
    .update({ read_at: now })
    .eq("user_id", userId)
    .eq("id", notificationId)
    .is("read_at", null)

  return !result.error
}

export async function markAllNotificationsRead(serviceClient: any, userId: string) {
  if (!(await isNotificationsTableAvailable(serviceClient))) return false

  const now = new Date().toISOString()
  const result = await serviceClient
    .from("user_notifications")
    .update({ read_at: now })
    .eq("user_id", userId)
    .is("read_at", null)

  return !result.error
}

export function formatNotificationTimeLabel(iso: string, now = new Date()) {
  const created = new Date(iso)
  if (Number.isNaN(created.getTime())) return "刚刚"

  const diffMs = now.getTime() - created.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin} 分钟前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`

  const todayKey = now.toISOString().slice(0, 10)
  const createdKey = created.toISOString().slice(0, 10)
  if (createdKey === todayKey) {
    const hh = String(created.getHours()).padStart(2, "0")
    const mm = String(created.getMinutes()).padStart(2, "0")
    return `今天 ${hh}:${mm}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (createdKey === yesterday.toISOString().slice(0, 10)) return "昨天"

  const diffDay = Math.floor(diffMs / 86400000)
  if (diffDay < 7) return `${diffDay} 天前`

  return `${created.getMonth() + 1} 月 ${created.getDate()} 日`
}

export function toAppNotification(item: ReturnType<typeof mapNotificationRow>) {
  return {
    id: item.id,
    category: item.category,
    ruleKey: item.ruleKey,
    title: item.title,
    body: item.body,
    href: item.href,
    payload: item.payload,
    unread: !item.readAt,
    createdAt: item.createdAt,
    timeLabel: formatNotificationTimeLabel(item.createdAt),
  }
}
