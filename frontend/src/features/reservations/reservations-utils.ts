import { useEffect, useState } from "react"
import {
  loadFloorPlanTables,
  saveFloorPlanTables,
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
 * Table choices for the New Reservation / Walk-in forms. Fetches the authoritative
 * table list from the backend server so deployed/fresh environments show all tables,
 * while initializing from the local snapshot for immediate render.
 */
export function useTableOptions(): TableOption[] {
  const [options, setOptions] = useState<TableOption[]>(() => {
    const floorPlanTables = loadFloorPlanTables()
    return floorPlanTables && floorPlanTables.length > 0 ? floorPlanTables : []
  })

  useEffect(() => {
    let cancelled = false
    void fetchFloorPlanFromServer().then((tables) => {
      if (cancelled || !tables) return
      const summaries: TableOption[] = tables.map((t) => ({
        id: t.id,
        name: t.name,
        floor: t.floor || "Main Floor",
        capacity: t.capacity,
      }))
      setOptions(summaries)
      saveFloorPlanTables(summaries)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return options
}

/**
 * Builds the tables for the Floor Plan picker dialog from what the Floor Plan
 * builder saved locally: each table's summary (id/name/capacity/floor) plus
 * its saved geometry (position/size/shape/rotation). Tables the builder never
 * placed have no geometry, so the viewer falls back to arranging them in a
 * grid. Tables too small for the party are dimmed and not selectable.
 */
export function buildViewerTables(_partySize: number): FloorPlanViewerTable[] {
  const summaries = loadFloorPlanTables() ?? []
  const positions = loadPositions()
  return summaries.map((t) => {
    const p = positions[t.id] ?? {}
    const isFacility = t.elementType === "FACILITY" || t.capacity === 0
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
      available: !isFacility,
      elementType: isFacility ? "FACILITY" : "TABLE",
      facilityType: t.facilityType,
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
export async function loadViewerTables(
  partySize: number,
  reservedFor?: string,
): Promise<FloorPlanViewerTable[]> {
  const serverTables = await fetchFloorPlanFromServer(reservedFor)
  if (serverTables !== null) {
    saveFloorPlanTables(
      serverTables.map((t) => ({
        id: t.id,
        name: t.name,
        floor: t.floor || "Main Floor",
        capacity: t.capacity,
        elementType: t.elementType,
        facilityType: t.facilityType,
      }))
    )
    return serverTables.map((t) => toViewerTable(t, partySize))
  }
  return buildViewerTables(partySize)
}

function toViewerTable(t: FloorPlanTable, _partySize: number): FloorPlanViewerTable {
  const isFacility = t.elementType === "FACILITY" || t.capacity === 0
  const isMaintenance = t.status === "MAINTENANCE"
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
    available: !isFacility && !isMaintenance,
    elementType: isFacility ? "FACILITY" : "TABLE",
    facilityType: t.facilityType,
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

export interface ParsedReservationNotes {
  eventType?: string
  foodCategories: string[]
  specialRequests?: string
}

/**
 * Parses raw reservation notes string into structured properties:
 * - eventType (e.g. birthday, meeting)
 * - foodCategories (e.g. vegetarian, glutenFree)
 * - specialRequests (custom note text)
 */
export function parseReservationNotes(notesStr?: string | null): ParsedReservationNotes {
  let eventType: string | undefined = undefined
  let foodCategories: string[] = []
  const customNotes: string[] = []

  if (!notesStr) {
    return { eventType, foodCategories, specialRequests: undefined }
  }

  const parts = notesStr.split(";").map((p) => p.trim()).filter(Boolean)
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower.startsWith("event:")) {
      const val = part.slice(6).trim()
      if (val && val.toLowerCase() !== "unspecified") {
        eventType = val.toLowerCase()
      }
    } else if (lower.startsWith("food preferences:") || lower.startsWith("food category:") || lower.startsWith("food:")) {
      const colonIdx = part.indexOf(":")
      const cats = part.slice(colonIdx + 1).split(",").map((c) => c.trim()).filter(Boolean)
      foodCategories = cats
    } else {
      customNotes.push(part)
    }
  }

  return {
    eventType,
    foodCategories,
    specialRequests: customNotes.join("; ") || undefined,
  }
}

/**
 * Bundles structured reservation event, food categories, and special request
 * into a single unified notes string.
 */
export function buildReservationNotes(input: {
  eventType?: string
  foodCategories?: string[]
  specialRequests?: string
}): string | undefined {
  const parts: string[] = []
  if (input.eventType && input.eventType !== "unspecified") {
    parts.push(`Event: ${input.eventType}`)
  }
  if (input.foodCategories && input.foodCategories.length > 0) {
    parts.push(`Food preferences: ${input.foodCategories.join(", ")}`)
  }
  if (input.specialRequests && input.specialRequests.trim()) {
    parts.push(input.specialRequests.trim())
  }
  return parts.length > 0 ? parts.join("; ") : undefined
}

