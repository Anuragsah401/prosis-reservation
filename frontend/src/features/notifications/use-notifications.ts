import { useCallback, useEffect, useMemo, useState } from "react"
import type { AppNotification } from "@/features/notifications/notification-data"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from "@/features/notifications/notification-service"

/**
 * Polling interval for refreshing notifications from the backend once it's
 * wired up. Harmless no-op against the localStorage mock in the meantime.
 */
const POLL_INTERVAL_MS = 60_000

export interface UseNotificationsResult {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * Central hook for the notification bell — fetches notifications, exposes
 * read/dismiss actions, and keeps an unread count for the badge. Pass a
 * `restaurantId` once auth/session is available to have this hook talk to
 * the real backend automatically (see `notification-service.ts`).
 */
export function useNotifications(restaurantId?: string): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchNotifications(restaurantId)
    setNotifications(
      [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    )
    setIsLoading(false)
  }, [restaurantId])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const data = await fetchNotifications(restaurantId)
      if (cancelled) return
      setNotifications(
        [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
      setIsLoading(false)
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [restaurantId])

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
      await markNotificationRead(id, restaurantId)
    },
    [restaurantId],
  )

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead(restaurantId)
  }, [restaurantId])

  const dismiss = useCallback(
    async (id: string) => {
      setNotifications((current) => current.filter((n) => n.id !== id))
      await dismissNotification(id, restaurantId)
    },
    [restaurantId],
  )

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return { notifications, unreadCount, isLoading, markRead, markAllRead, dismiss, refresh }
}
