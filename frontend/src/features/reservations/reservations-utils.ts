import { useMemo } from "react"
import { loadFloorPlanTables } from "@/features/floor-plan/floor-plan-storage"

export interface TableOption {
  id: string
  name: string
  floor: string
  capacity: number
}

/**
 * Table choices for the New Reservation / Walk-in forms. Prefers whatever
 * tables are currently configured in the Floor Plan builder, so adding a
 * table there makes it selectable here immediately.
 */
export function useTableOptions(): TableOption[] {
  return useMemo(() => {
    const floorPlanTables = loadFloorPlanTables()
    return floorPlanTables && floorPlanTables.length > 0 ? floorPlanTables : []
  }, [])
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
