import { loadFloorNames, loadFloorPlanTables } from "@/features/floor-plan/floor-plan-storage"

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
  /** The underlying customer record, so contact edits can be persisted. */
  customerId?: string
  customerName: string
  /** Customer contact phone number. */
  customerPhone: string
  /** Optional customer email address. */
  customerEmail?: string
  tableId: string
  /** Name of the assigned table. Missing when the guest will choose their own table. */
  tableName?: string
  partySize: number
  /** ISO datetime string for the reservation start. */
  start: string
  /** Duration in minutes (default 90). */
  durationMinutes: number
  status: ReservationStatus
  notes?: string
  /** Special request notes from the customer / staff. */
  specialRequests?: string
  /** Preferred food categories/cuisines requested by the customer, if any. */
  foodCategories?: string[]
  /** The type of event this reservation is for (birthday, meeting, ...). */
  eventType?: string
}

/**
 * Table source for reservations calendar views.
 * Returns only tables configured via Floor Plan builder persistence.
 */
export function getCalendarTables(): CalendarTable[] {
  const summaries = loadFloorPlanTables() ?? []
  if (summaries.length === 0) return []

  const floorOrder = loadFloorNames() ?? []
  const floorRank = new Map(floorOrder.map((floor, i) => [floor, i]))

  return summaries
    .map((t) => ({
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      floor: t.floor,
    }))
    .sort((a, b) => {
      const aRank = floorRank.get(a.floor) ?? Number.MAX_SAFE_INTEGER
      const bRank = floorRank.get(b.floor) ?? Number.MAX_SAFE_INTEGER
      if (aRank !== bRank) return aRank - bRank
      return a.name.localeCompare(b.name)
    })
}

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
