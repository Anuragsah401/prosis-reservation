import { apiClient, getCurrentRestaurantId } from "@/lib/api-client"
import type { AppNotification } from "@/features/notifications/notification-data"

const STORAGE_KEY = "prosisit:notifications"

/**
 * Notification service layer against the real backend (`/api/notifications`).
 * The backend is the source of truth — notifications are created server-side
 * as reservation events happen, so they survive a refresh and show up across
 * devices. localStorage is only a fallback so the feed still renders (empty)
 * when there's no signed-in restaurant context or the backend is unreachable.
 *
 * Endpoints:
 *   GET    /api/notifications               -> AppNotification[]
 *   PATCH  /api/notifications/:id/read      -> { read: true }
 *   PATCH  /api/notifications/read-all      -> { read: true }
 *   DELETE /api/notifications/:id           -> 204
 */

function loadLocal(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

export async function fetchNotifications(restaurantId?: string): Promise<AppNotification[]> {
  const id = restaurantId ?? getCurrentRestaurantId()
  if (id) {
    try {
      // The restaurant is derived from the JWT, not sent as a query param.
      const data = await apiClient.get<AppNotification[]>("/notifications")
      saveLocal(data)
      return data
    } catch (err) {
      console.error("[notifications] Failed to load from backend:", err)
    }
  }
  return loadLocal()
}

export async function markNotificationRead(id: string, restaurantId?: string): Promise<void> {
  if (restaurantId ?? getCurrentRestaurantId()) {
    try {
      await apiClient.patch(`/notifications/${id}/read`)
    } catch (err) {
      console.error("[notifications] Failed to mark read on backend:", err)
    }
  }
  const current = loadLocal()
  saveLocal(current.map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export async function markAllNotificationsRead(restaurantId?: string): Promise<void> {
  if (restaurantId ?? getCurrentRestaurantId()) {
    try {
      await apiClient.patch("/notifications/read-all")
    } catch (err) {
      console.error("[notifications] Failed to mark all read on backend:", err)
    }
  }
  const current = loadLocal()
  saveLocal(current.map((n) => ({ ...n, read: true })))
}

export async function dismissNotification(id: string, restaurantId?: string): Promise<void> {
  if (restaurantId ?? getCurrentRestaurantId()) {
    try {
      await apiClient.delete(`/notifications/${id}`)
    } catch (err) {
      console.error("[notifications] Failed to dismiss on backend:", err)
    }
  }
  const current = loadLocal()
  saveLocal(current.filter((n) => n.id !== id))
}
