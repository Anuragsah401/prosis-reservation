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
import type { CalendarReservation } from "@/features/reservations-calendar/calendar-data"

export interface TableOption {
  id: string
  name: string
  floor: string
  capacity: number
  groupId?: string | null
  groupName?: string | null
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
        groupId: t.groupId ?? null,
        groupName: t.groupName ?? null,
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
export function buildViewerTables(partySize: number): FloorPlanViewerTable[] {
  const summaries = loadFloorPlanTables() ?? []
  const positions = loadPositions()
  return summaries.map((t) => {
    const p = positions[t.id] ?? {}
    const isFacility = t.elementType === "FACILITY" || t.capacity === 0
    const isMaintenance = t.status === "MAINTENANCE"
    const isBooked = t.status === "RESERVED" || t.status === "OCCUPIED"
    const isTooSmall = Boolean(partySize && partySize > 0 && t.capacity > 0 && t.capacity < partySize)
    const isAvailable = !isFacility && !isMaintenance && !isBooked && !isTooSmall
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
      available: isAvailable,
      status: t.status ?? (isAvailable ? "AVAILABLE" : "RESERVED"),
      elementType: isFacility ? "FACILITY" : "TABLE",
      facilityType: t.facilityType,
      groupId: p.groupId ?? t.groupId ?? null,
      groupName: p.groupName ?? t.groupName ?? null,
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
        status: t.status,
        elementType: t.elementType,
        facilityType: t.facilityType,
        groupId: t.groupId ?? null,
        groupName: t.groupName ?? null,
      }))
    )
    return serverTables.map((t) => toViewerTable(t, partySize))
  }
  return buildViewerTables(partySize)
}

function toViewerTable(t: FloorPlanTable, partySize: number): FloorPlanViewerTable {
  const isFacility = t.elementType === "FACILITY" || t.capacity === 0
  const isMaintenance = t.status === "MAINTENANCE"
  const isBooked = t.status === "RESERVED" || t.status === "OCCUPIED"
  const isTooSmall = Boolean(partySize && partySize > 0 && t.capacity > 0 && t.capacity < partySize)
  const isAvailable = !isFacility && !isMaintenance && !isBooked && !isTooSmall

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
    available: isAvailable,
    status: t.status ?? (isAvailable ? "AVAILABLE" : "RESERVED"),
    elementType: isFacility ? "FACILITY" : "TABLE",
    facilityType: t.facilityType,
    groupId: t.groupId ?? null,
    groupName: t.groupName ?? null,
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

export function getReservationEndTime(startIso: string, durationMinutes: number): string {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + (durationMinutes || 90) * 60_000)
  return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
}

/**
 * Downloads a formatted CSV file of reservations for the given day or filter.
 */
export function exportReservationsToCSV(reservations: CalendarReservation[], dateStr: string) {
  const headers = [
    "Customer Name",
    "Phone",
    "Email",
    "Time",
    "Party Size",
    "Table",
    "Status",
    "Event Type",
    "Dietary Preferences",
    "Special Requests",
  ]

  const rows = reservations.map((r) => {
    const parsed = parseReservationNotes(r.notes)
    const startTime = new Date(r.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    const endTime = getReservationEndTime(r.start, r.durationMinutes)
    const eventType = r.eventType || parsed.eventType || ""
    const foodCategories = (r.foodCategories && r.foodCategories.length > 0 ? r.foodCategories : parsed.foodCategories).join(", ")
    const specialRequests = r.specialRequests || parsed.specialRequests || ""

    return [
      `"${(r.customerName || "").replace(/"/g, '""')}"`,
      `"${(r.customerPhone || "").replace(/"/g, '""')}"`,
      `"${(r.customerEmail || "").replace(/"/g, '""')}"`,
      `"${startTime} - ${endTime}"`,
      r.partySize,
      `"${(r.tableName || "Unassigned").replace(/"/g, '""')}"`,
      `"${r.status}"`,
      `"${eventType.replace(/"/g, '""')}"`,
      `"${foodCategories.replace(/"/g, '""')}"`,
      `"${specialRequests.replace(/"/g, '""')}"`,
    ].join(",")
  })

  const csvContent = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `reservations_${dateStr}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Opens a dedicated print preview window formatted cleanly as a host/kitchen service sheet.
 */
export function printDailyRunSheet(
  reservations: CalendarReservation[],
  dateStr: string,
  restaurantName = "Restaurant",
) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const totalGuests = reservations.reduce((sum, r) => sum + (r.partySize || 0), 0)

  const rowsHtml = reservations
    .map((r, idx) => {
      const parsed = parseReservationNotes(r.notes)
      const startTime = new Date(r.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      const endTime = getReservationEndTime(r.start, r.durationMinutes)
      const eventType = r.eventType || parsed.eventType
      const foodCategories = (r.foodCategories && r.foodCategories.length > 0 ? r.foodCategories : parsed.foodCategories).join(", ")
      const specialRequests = r.specialRequests || parsed.specialRequests

      return `
        <tr style="border-bottom: 1px solid #e5e7eb; font-size: 13px;">
          <td style="padding: 8px 10px; font-weight: bold; color: #111827;">${idx + 1}</td>
          <td style="padding: 8px 10px; font-weight: 600; color: #1f2937;">${r.customerName}</td>
          <td style="padding: 8px 10px; color: #4b5563;">${r.customerPhone || "—"}</td>
          <td style="padding: 8px 10px; font-weight: 600; color: #111827;">${startTime} – ${endTime}</td>
          <td style="padding: 8px 10px; text-align: center; font-weight: bold;">${r.partySize}p</td>
          <td style="padding: 8px 10px; font-weight: 600; color: #4f46e5;">${r.tableName || "Unassigned"}</td>
          <td style="padding: 8px 10px; font-size: 11px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; background: #f3f4f6; font-weight: 600;">
              ${r.status}
            </span>
          </td>
          <td style="padding: 8px 10px; color: #4b5563; font-size: 11px;">
            ${eventType ? `<strong style="color: #7c3aed;">[${eventType.toUpperCase()}]</strong> ` : ""}
            ${foodCategories ? `<em style="color: #059669;">(${foodCategories})</em> ` : ""}
            ${specialRequests || "—"}
          </td>
          <td style="padding: 8px 10px; text-align: center; width: 40px;">
            <div style="width: 16px; height: 16px; border: 1.5px solid #9ca3af; border-radius: 3px; margin: 0 auto;"></div>
          </td>
        </tr>
      `
    })
    .join("")

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reservation Run Sheet - ${dateStr}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f9fafb; padding: 10px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; color: #374151; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111827; padding-bottom: 12px; }
          .meta { font-size: 13px; color: #4b5563; margin-top: 4px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${restaurantName} · Reservation Run Sheet</h1>
            <div class="meta">Date: <strong>${dateStr}</strong> · Printed at: ${new Date().toLocaleTimeString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 800; color: #4f46e5;">${reservations.length} Bookings · ${totalGuests} Total Covers</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Time</th>
              <th style="text-align: center;">Party</th>
              <th>Table</th>
              <th>Status</th>
              <th>Notes / Dietary / Event</th>
              <th style="text-align: center;">Check</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #9ca3af;">No reservations for this day.</td></tr>`}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

