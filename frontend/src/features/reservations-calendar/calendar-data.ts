export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export interface CalendarTable {
  id: string
  name: string
  capacity: number
  /** Floor/section grouping, used by the booking diagram (Gantt) view. */
  floor: string
}

export interface CalendarReservation {
  id: string
  customerName: string
  /** Customer contact phone number. */
  customerPhone: string
  /** Optional customer email address. */
  customerEmail?: string
  tableId: string
  partySize: number
  /** ISO datetime string for the reservation start. */
  start: string
  /** Duration in minutes (default 90). */
  durationMinutes: number
  status: ReservationStatus
  notes?: string
}

/**
 * Mock tables standing in for `GET /api/tables?restaurantId=...`.
 * Kept intentionally separate from `features/floor-plan/floor-plan-data.ts`
 * to avoid coupling the calendar to floor-plan-only fields (shape/position).
 */
export const calendarTables: CalendarTable[] = [
  { id: "t1", name: "1", capacity: 2, floor: "Restaurant" },
  { id: "t2", name: "2", capacity: 6, floor: "Restaurant" },
  { id: "t3", name: "3", capacity: 4, floor: "Restaurant" },
  { id: "t4", name: "4", capacity: 4, floor: "Restaurant" },
  { id: "t5", name: "5", capacity: 2, floor: "Restaurant" },
  { id: "t6", name: "6", capacity: 8, floor: "Restaurant" },
  { id: "t7", name: "1", capacity: 4, floor: "First floor" },
  { id: "t8", name: "2", capacity: 6, floor: "First floor" },
  { id: "t9", name: "3", capacity: 4, floor: "First floor" },
  { id: "t10", name: "4", capacity: 6, floor: "First floor" },
]

export const statusColors: Record<ReservationStatus, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "oklch(0.9 0.14 90 / 0.35)", border: "oklch(0.75 0.16 90)", text: "oklch(0.35 0.1 90)" },
  CONFIRMED: { bg: "oklch(0.6 0.2 255 / 0.25)", border: "oklch(0.55 0.22 255)", text: "oklch(0.3 0.15 255)" },
  CHECKED_IN: { bg: "oklch(0.75 0.18 155 / 0.3)", border: "oklch(0.6 0.18 155)", text: "oklch(0.3 0.12 155)" },
  COMPLETED: { bg: "oklch(0.9 0 0)", border: "oklch(0.7 0 0)", text: "oklch(0.4 0 0)" },
  CANCELLED: { bg: "oklch(0.85 0.13 25 / 0.3)", border: "oklch(0.6 0.22 25)", text: "oklch(0.35 0.15 25)" },
  NO_SHOW: { bg: "oklch(0.85 0.13 25 / 0.3)", border: "oklch(0.6 0.22 25)", text: "oklch(0.35 0.15 25)" },
}

export const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
}

function todayAt(hour: number, minute = 0): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function daysFromNowAt(days: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/**
 * Mock reservation seed data standing in for `GET /api/reservations?restaurantId=...`.
 * Spread across today and the next few days so Day/Week/Timeline views all
 * have representative data. Swap for a real fetch once auth/restaurant
 * context is wired into the frontend.
 */
export const initialReservations: CalendarReservation[] = [
  { id: "r1", customerName: "Henry Hall", customerPhone: "+1 555 0101", tableId: "t1", partySize: 2, start: todayAt(17, 30), durationMinutes: 45, status: "CONFIRMED" },
  { id: "r2", customerName: "Liam Martinez", customerPhone: "+1 555 0102", tableId: "t2", partySize: 7, start: todayAt(17, 45), durationMinutes: 45, status: "PENDING" },
  { id: "r3", customerName: "Emma Rodriguez", customerPhone: "+1 555 0103", tableId: "t4", partySize: 4, start: todayAt(18, 0), durationMinutes: 105, status: "CHECKED_IN" },
  { id: "r4", customerName: "James Wilson", customerPhone: "+1 555 0104", tableId: "t5", partySize: 2, start: todayAt(18, 45), durationMinutes: 90, status: "CONFIRMED" },
  { id: "r5", customerName: "Noah Lee", customerPhone: "+1 555 0105", tableId: "t7", partySize: 4, start: todayAt(18, 0), durationMinutes: 90, status: "CHECKED_IN" },
  { id: "r6", customerName: "Isabella Anderson", customerPhone: "+1 555 0106", tableId: "t8", partySize: 8, start: todayAt(18, 30), durationMinutes: 90, status: "CONFIRMED" },
  { id: "r7", customerName: "William Taylor", customerPhone: "+1 555 0107", tableId: "t9", partySize: 12, start: todayAt(18, 0), durationMinutes: 60, status: "CHECKED_IN" },
  { id: "r8", customerName: "Amelia Lewis", customerPhone: "+1 555 0108", tableId: "t10", partySize: 3, start: todayAt(18, 15), durationMinutes: 75, status: "CONFIRMED" },
  { id: "r9", customerName: "Alice Johnson", customerPhone: "+1 555 0109", tableId: "t6", partySize: 12, start: todayAt(19, 0), durationMinutes: 45, status: "PENDING" },
  { id: "r10", customerName: "Ella Young", customerPhone: "+1 555 0110", tableId: "t9", partySize: 12, start: todayAt(19, 0), durationMinutes: 45, status: "CONFIRMED" },
  { id: "r11", customerName: "Olivia Garcia", customerPhone: "+1 555 0111", tableId: "t10", partySize: 12, start: todayAt(19, 0), durationMinutes: 45, status: "CHECKED_IN" },
  { id: "r12", customerName: "Alexander White", customerPhone: "+1 555 0112", tableId: "t8", partySize: 10, start: todayAt(19, 0), durationMinutes: 45, status: "CONFIRMED" },
  { id: "r13", customerName: "Sara Wu", customerPhone: "+1 555 0113", tableId: "t2", partySize: 5, start: daysFromNowAt(1, 18, 30), durationMinutes: 90, status: "CONFIRMED" },
  { id: "r14", customerName: "Omar Faruk", customerPhone: "+1 555 0114", tableId: "t4", partySize: 2, start: daysFromNowAt(1, 19, 45), durationMinutes: 60, status: "PENDING" },
  { id: "r15", customerName: "Elena Petrova", customerPhone: "+1 555 0115", tableId: "t6", partySize: 8, start: daysFromNowAt(2, 19, 0), durationMinutes: 120, status: "CONFIRMED" },
  { id: "r16", customerName: "James Carter", customerPhone: "+1 555 0116", tableId: "t5", partySize: 2, start: daysFromNowAt(-1, 20, 0), durationMinutes: 90, status: "COMPLETED" },
]
