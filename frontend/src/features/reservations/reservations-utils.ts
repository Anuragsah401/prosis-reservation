import { useMemo } from "react"
import { calendarTables } from "@/features/reservations-calendar/calendar-data"
import { loadFloorPlanTables } from "@/features/floor-plan/floor-plan-storage"
import { loadOverrides } from "@/features/reservations-calendar/calendar-storage"
import { initialReservations } from "@/features/reservations-calendar/calendar-data"

export interface TableOption {
  id: string
  name: string
  floor: string
  capacity: number
}

/**
 * Table choices for the New Reservation / Walk-in forms. Prefers whatever
 * tables are currently configured in the Floor Plan builder, so adding a
 * table there makes it selectable here immediately. Falls back to the mock
 * calendar tables if nothing has been configured in Floor Plan yet.
 */
export function useTableOptions(): TableOption[] {
  return useMemo(() => {
    const floorPlanTables = loadFloorPlanTables()
    if (floorPlanTables && floorPlanTables.length > 0) return floorPlanTables
    return calendarTables
  }, [])
}

export function withOverrides() {
  const overrides = loadOverrides()
  return initialReservations.map((r) => {
    const o = overrides[r.id]
    if (!o) return r
    return { ...r, start: o.start, durationMinutes: o.durationMinutes, tableId: o.tableId }
  })
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function toDateInputValue(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
