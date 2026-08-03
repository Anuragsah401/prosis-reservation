import { API_URL } from "@/lib/config"
import { initialNotifications, type AppNotification } from "@/features/notifications/notification-data"

const STORAGE_KEY = "prosisit:notifications"

/**
 * Notification service layer — designed as a drop-in point for the real
 * backend API. Each function first attempts the corresponding REST call
 * (commented endpoint paths below match the pattern used elsewhere in this
 * app, e.g. `floor-plan-storage.ts` / `calendar-storage.ts`) and falls back
 * to a localStorage-backed mock so the UI is fully functional before auth
 * and the backend endpoints exist.
 *
 * Expected backend endpoints (once implemented):
 *   GET    /api/notifications                 -> AppNotification[]
 *   PATCH  /api/notifications/:id/read         -> { read: true }
 *   PATCH  /api/notifications/read-all         -> { read: true }
 *   DELETE /api/notifications/:id              -> 204
 *
 * To connect to the real backend, replace the body of each function below
 * with the corresponding `fetch(`${API_URL}/notifications...`)` call — the
 * public function signatures are already shaped to match, so no caller
 * changes should be needed.
 */

function loadLocal(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialNotifications
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : initialNotifications
  } catch {
    return initialNotifications
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
  if (restaurantId) {
    try {
      const res = await fetch(`${API_URL}/notifications?restaurantId=${restaurantId}`)
      if (res.ok) {
        const data = (await res.json()) as AppNotification[]
        saveLocal(data)
        return data
      }
    } catch {
      // fall through to local mock
    }
  }
  return loadLocal()
}

export async function markNotificationRead(id: string, restaurantId?: string): Promise<void> {
  if (restaurantId) {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, { method: "PATCH" })
      if (res.ok) {
        const current = loadLocal()
        saveLocal(current.map((n) => (n.id === id ? { ...n, read: true } : n)))
        return
      }
    } catch {
      // fall through to local mock
    }
  }
  const current = loadLocal()
  saveLocal(current.map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export async function markAllNotificationsRead(restaurantId?: string): Promise<void> {
  if (restaurantId) {
    try {
      const res = await fetch(`${API_URL}/notifications/read-all`, { method: "PATCH" })
      if (res.ok) {
        const current = loadLocal()
        saveLocal(current.map((n) => ({ ...n, read: true })))
        return
      }
    } catch {
      // fall through to local mock
    }
  }
  const current = loadLocal()
  saveLocal(current.map((n) => ({ ...n, read: true })))
}

export async function dismissNotification(id: string, restaurantId?: string): Promise<void> {
  if (restaurantId) {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}`, { method: "DELETE" })
      if (res.ok) {
        const current = loadLocal()
        saveLocal(current.filter((n) => n.id !== id))
        return
      }
    } catch {
      // fall through to local mock
    }
  }
  const current = loadLocal()
  saveLocal(current.filter((n) => n.id !== id))
}
