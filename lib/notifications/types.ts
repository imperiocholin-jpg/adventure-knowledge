export type NotificationCategory = "adventure" | "library" | "pet" | "system"

export interface AppNotification {
  id: string
  category: NotificationCategory
  ruleKey: string
  title: string
  body: string
  timeLabel: string
  unread: boolean
  href?: string
  payload?: Record<string, unknown>
  createdAt: string
}

export interface NotificationListPayload {
  items: AppNotification[]
  unreadCount: number
}
