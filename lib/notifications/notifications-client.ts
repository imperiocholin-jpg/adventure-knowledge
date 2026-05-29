import type { AppNotification, NotificationListPayload } from "@/lib/notifications/types"

export const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated"

export async function fetchNotifications(): Promise<NotificationListPayload | null> {
  try {
    const response = await fetch("/api/notifications", { cache: "no-store" })
    const payload = await response.json()
    if (!response.ok || !payload?.data) return null
    return payload.data as NotificationListPayload
  } catch {
    return null
  }
}

export async function markNotificationReadApi(id: string) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
  const payload = await response.json()
  return { ok: response.ok && payload?.ok !== false, payload }
}

export async function markAllNotificationsReadApi() {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  })
  const payload = await response.json()
  return { ok: response.ok && payload?.ok !== false, payload }
}

export function dispatchNotificationsUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT))
}

export type { AppNotification, NotificationListPayload }
