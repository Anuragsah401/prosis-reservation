import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"
import { API_URL } from "@/lib/config"

const STORAGE_KEY = "prosisit:reservations:calendar-overrides"

export type ReservationOverride = Pick<CalendarReservation, "id" | "start" | "durationMinutes" | "tableId">

/**
 * Persists reservation time/table/duration changes made via drag-and-drop
 * or resize on the calendar.
 *
 * Attempts the real backend endpoint first — `PATCH /api/reservations/:id`
 * (see `backend/src/modules/reservation/reservation.routes.ts`), which
 * requires an authenticated session and accepts `tableId`/`reservedFor`.
 * Falls back to localStorage when unauthenticated/offline so the calendar
 * remains fully interactive without a wired-up login flow.
 */
export async function saveReservationChange(
  change: ReservationOverride,
): Promise<{ persisted: "server" | "local" }> {
  try {
    const res = await fetch(`${API_URL}/reservations/${change.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: change.tableId,
        reservedFor: change.start,
      }),
    })
    if (res.ok) {
      saveLocal(change)
      return { persisted: "server" }
    }
  } catch {
    // fall through to local persistence
  }

  await new Promise((resolve) => setTimeout(resolve, 200))
  saveLocal(change)
  return { persisted: "local" }
}

function saveLocal(change: ReservationOverride) {
  const existing = loadOverrides()
  existing[change.id] = change
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function loadOverrides(): Record<string, ReservationOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
