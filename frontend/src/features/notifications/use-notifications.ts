import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getCurrentRestaurantId } from "@/lib/api-client"
import type { AppNotification } from "@/features/notifications/notification-data"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from "@/features/notifications/notification-service"
import { subscribeToNotificationRefresh } from "@/features/notifications/notification-events"

/**
 * How often the feed refetches from the backend. Catches changes made by
 * other staff or by guests confirming/cancelling on the public page. Your own
 * actions refresh instantly via the notification event bus instead.
 */
const POLL_INTERVAL_MS = 30_000

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
 * Central hook for the notification bell — fetches from the backend (scoped
 * to the signed-in user's restaurant), exposes read/dismiss actions, keeps an
 * unread count for the badge, refetches on the poll interval, and refreshes
 * immediately when a reservation mutation emits a refresh event.
 */
export function useNotifications(restaurantId?: string): UseNotificationsResult {
  const effectiveRestaurantId = restaurantId ?? getCurrentRestaurantId()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Guard against overlapping fetches (an in-flight action refresh racing a poll).
  const refreshInFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    try {
      const data = await fetchNotifications(effectiveRestaurantId)
      setNotifications(
        [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      )
    } finally {
      refreshInFlight.current = false
      setIsLoading(false)
    }
  }, [effectiveRestaurantId])

  useEffect(() => {
    void refresh()
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS)
    const unsubscribe = subscribeToNotificationRefresh(() => void refresh())
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [refresh])

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
      await markNotificationRead(id, effectiveRestaurantId)
    },
    [effectiveRestaurantId],
  )

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    await markAllNotificationsRead(effectiveRestaurantId)
  }, [effectiveRestaurantId])

  const dismiss = useCallback(
    async (id: string) => {
      setNotifications((current) => current.filter((n) => n.id !== id))
      await dismissNotification(id, effectiveRestaurantId)
    },
    [effectiveRestaurantId],
  )

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  return { notifications, unreadCount, isLoading, markRead, markAllRead, dismiss, refresh }
}
