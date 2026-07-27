export interface RestaurantSummary {
  id: string
  name: string
  address?: string
  timezone: string
}

/**
 * Mock stand-in for `GET /api/restaurants/:id` (public detail lookup).
 * Replace with a real fetch once wired to the backend.
 */
export function getMockRestaurant(id: string): RestaurantSummary {
  return {
    id,
    name: "Prosisit Table Bistro",
    address: "123 Main St, Springfield",
    timezone: "UTC",
  }
}

export const OPENING_HOUR = 11 // 11:00
export const CLOSING_HOUR = 22 // 22:00 (last slot before this)
export const SLOT_INTERVAL_MINUTES = 30

export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
    }
  }
  return slots
}

/**
 * Mock stand-in for `GET /api/reservations/availability`. Deterministically
 * "books out" a few slots per day so the UI has something to react to.
 * Replace with a real availability fetch once wired to the backend
 * (real endpoint checks a specific tableId, not restaurant-wide slots).
 */
export function getBookedSlots(date: string): Set<string> {
  const seed = date
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const slots = generateTimeSlots()
  const booked = new Set<string>()
  booked.add(slots[seed % slots.length])
  booked.add(slots[(seed * 3 + 2) % slots.length])
  return booked
}
