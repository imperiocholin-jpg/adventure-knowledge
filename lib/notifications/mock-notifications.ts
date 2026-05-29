export type { AppNotification, NotificationCategory, NotificationListPayload } from "@/lib/notifications/types"

/** @deprecated 消息已接入 user_notifications 表，请使用 useNotifications / fetchNotifications */
export function countUnreadNotifications() {
  return 0
}
