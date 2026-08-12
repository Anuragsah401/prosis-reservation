import { useMemo } from "react"
import {
  loadFloorPlanTables,
  loadPositions,
  fetchFloorPlanFromServer,
} from "@/features/floor-plan/floor-plan-storage"
import {
  DEFAULT_TABLE_WIDTH,
  DEFAULT_TABLE_HEIGHT,
} from "@/features/floor-plan/floor-plan-data"
import type { FloorPlanTable } from "@/features/floor-plan/floor-plan-data"
import type { FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"

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

/**
 * Builds the tables for the Floor Plan picker dialog from what the Floor Plan
 * builder saved locally: each table's summary (id/name/capacity/floor) plus
 * its saved geometry (position/size/shape/rotation). Tables the builder never
 * placed have no geometry, so the viewer falls back to arranging them in a
 * grid. Tables too small for the party are dimmed and not selectable.
 */
export function buildViewerTables(partySize: number): FloorPlanViewerTable[] {
  const summaries = loadFloorPlanTables() ?? []
  const positions = loadPositions()
  return summaries.map((t) => {
    const p = positions[t.id] ?? {}
    return {
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      floor: t.floor || "Main Floor",
      shape: p.shape ?? "RECTANGLE",
      positionX: p.positionX ?? null,
      positionY: p.positionY ?? null,
      width: p.width ?? DEFAULT_TABLE_WIDTH,
      height: p.height ?? DEFAULT_TABLE_HEIGHT,
      rotation: p.rotation ?? 0,
      available: t.capacity >= partySize,
    }
  })
}

/**
 * Tables for the Floor Plan picker, loaded from the backend the same way the
 * Floor Plan builder does. The backend is the shared source of truth — a plan
 * saved on one browser must show up here on another, so reading only this
 * browser's localStorage was why the picker could drift out of sync. When the
 * backend can't be reached (e.g. not logged in) we fall back to the local
 * snapshot, which is also what makes the picker render instantly.
 */
export async function loadViewerTables(partySize: number): Promise<FloorPlanViewerTable[]> {
  const serverTables = await fetchFloorPlanFromServer()
  if (serverTables !== null) return serverTables.map((t) => toViewerTable(t, partySize))
  return buildViewerTables(partySize)
}

function toViewerTable(t: FloorPlanTable, partySize: number): FloorPlanViewerTable {
  return {
    id: t.id,
    name: t.name,
    capacity: t.capacity,
    floor: t.floor || "Main Floor",
    shape: t.shape ?? "RECTANGLE",
    positionX: t.positionX ?? null,
    positionY: t.positionY ?? null,
    width: t.width ?? DEFAULT_TABLE_WIDTH,
    height: t.height ?? DEFAULT_TABLE_HEIGHT,
    rotation: t.rotation ?? 0,
    available: t.capacity >= partySize,
  }
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
