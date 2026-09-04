import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import { getCurrentRestaurantId } from "@/lib/api-client"
import type { AppNotification } from "@/features/notifications/notification-data"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from "@/features/notifications/notification-service"
import { subscribeToNotificationRefresh } from "@/features/notifications/notification-events"
import { useRealtimeListener } from "@/features/realtime"
import { soundManager, triggerReservationConfirmedAlert } from "@/lib/sound"

/**
 * Fallback poll interval. Real-time events push instantly via Server-Sent Events.
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
 * Central hook for the notification bell — fetches from the backend (scoped
 * to the signed-in user's restaurant), exposes read/dismiss actions, keeps an
 * unread count for the badge, subscribes to real-time events, and refetches on
 * the poll interval.
 */
export function useNotifications(restaurantId?: string): UseNotificationsResult {
  // `getCurrentRestaurantId()` can return null (no signed-in restaurant); the
  // service functions take `string | undefined`, so collapse null to undefined.
  const effectiveRestaurantId = restaurantId ?? getCurrentRestaurantId() ?? undefined
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

  // Real-time notification updates
  useRealtimeListener("NOTIFICATION_NEW", (event) => {
    if (event.payload) {
      const notif = event.payload
      setNotifications((current) => {
        const exists = current.some((n) => n.id === notif.id)
        if (exists) return current
        return [notif, ...current]
      })

      if (notif.type === "reservation_confirmed") {
        triggerReservationConfirmedAlert({
          id: notif.id,
          title: notif.title || "Reservation Confirmed by Customer",
          message: notif.message,
        })
      }
    } else {
      void refresh()
    }
  })

  useRealtimeListener("RESERVATION_STATUS_CHANGED", (event) => {
    void refresh()
    if (event.payload?.status === "CONFIRMED") {
      const res = event.payload
      const customerName = res.customer?.name || res.guestName
      const when = res.reservedFor || res.start
      const dateStr = when
        ? new Date(when).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : ""
      const tableName = res.table?.name || res.table?.number || res.tableName
      triggerReservationConfirmedAlert({
        id: res.id,
        customerName,
        partySize: res.partySize,
        dateStr,
        tableName,
      })
    }
  })

  useRealtimeListener("NOTIFICATION_READ", (event) => {
    if (event.payload?.all) {
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
    } else if (event.payload?.id) {
      if (event.payload.dismissed) {
        setNotifications((current) => current.filter((n) => n.id !== event.payload.id))
      } else {
        setNotifications((current) =>
          current.map((n) => (n.id === event.payload.id ? { ...n, read: true } : n)),
        )
      }
    } else {
      void refresh()
    }
  })

  useRealtimeListener("RESERVATION_CREATED", (event) => {
    void refresh()
    soundManager.playConfirmationChime()
    if (event.payload?.customer?.name) {
      const rawDate = event.payload.reservedFor || event.payload.start
      const dateStr = rawDate
        ? ` on ${new Date(rawDate).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}`
        : ""
      toast("New Reservation Received", {
        description: `${event.payload.customer.name} booked for ${event.payload.partySize} guests${dateStr}.`,
        icon: React.createElement(Bell, { className: "size-4 text-primary" }),
      })
    }
  })

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
