export interface RestaurantSummary {
  id: string
  name: string
  address?: string | null
  timezone: string
  openingTime?: number
  closingTime?: number
}

export const SLOT_INTERVAL_MINUTES = 30

/**
 * Generates available time slots between restaurant opening and closing hours.
 * Opening and closing times are in minutes from midnight (e.g. 11:00 = 660, 23:00 = 1380).
 */
export function generateTimeSlots(
  openingTime: number = 660,
  closingTime: number = 1380,
  intervalMinutes: number = SLOT_INTERVAL_MINUTES,
): string[] {
  const slots: string[] = []
  // Last seating allowed at least 60 minutes before closing
  const lastSlotMinutes = Math.max(openingTime, closingTime - 60)

  for (let mins = openingTime; mins <= lastSlotMinutes; mins += intervalMinutes) {
    const hour = Math.floor(mins / 60)
    const minute = mins % 60
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
  }

  return slots
}

/** Formats "HH:MM" (24h) time string (e.g. "19:30"). */
export function formatDisplayTime(time: string): string {
  if (!time) return ""
  const [hourStr = "00", minute = "00"] = time.split(":")
  return `${hourStr.padStart(2, "0")}:${minute.padStart(2, "0")}`
}
