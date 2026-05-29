"use client"

import { useCallback, useEffect, useState } from "react"

import {
  fetchNotifications,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
} from "@/lib/notifications/notifications-client"

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchNotifications()
      if (data) {
        setItems(data.items)
        setUnreadCount(data.unreadCount)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onUpdated = () => {
      void refresh()
    }
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated)
    window.addEventListener("focus", onUpdated)
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdated)
      window.removeEventListener("focus", onUpdated)
    }
  }, [refresh])

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await markNotificationReadApi(id)
    void refresh()
  }, [refresh])

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })))
    setUnreadCount(0)
    await markAllNotificationsReadApi()
    void refresh()
  }, [refresh])

  return {
    items,
    unreadCount,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  }
}
