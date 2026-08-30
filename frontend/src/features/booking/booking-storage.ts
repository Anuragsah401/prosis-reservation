import { apiClient } from "@/lib/api-client"
import type { FloorPlanViewerTable } from "@/features/floor-plan/floor-plan-viewer"

export interface PublicRestaurant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  logoUrl?: string | null
  timezone: string
  openingTime: number
  closingTime: number
  isActive: boolean
}

export interface PublicTableItem {
  id: string
  name?: string
  number?: string
  capacity: number
  floor?: string
  section?: string | null
  location?: string | null
  shape?: string
  positionX?: number | null
  positionY?: number | null
  width?: number | null
  height?: number | null
  rotation?: number | null
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED" | "MAINTENANCE"
}

export interface BookingRequest {
  restaurantId: string
  date: string
  time: string
  guests: number
  name: string
  email: string
  phone: string
  tableId?: string
  notes?: string
}

export interface BookingConfirmation {
  id: string
  restaurantId: string
  date: string
  time: string
  guests: number
  name: string
  email: string
  phone: string
  notes?: string
  table?: {
    id: string
    number: string
    floor?: string
  } | null
  status: string
  createdAt: string
}

/** Fetches public restaurant details (opening/closing hours, address, timezone). */
export async function fetchPublicRestaurant(restaurantId: string): Promise<PublicRestaurant> {
  return apiClient.get<PublicRestaurant>(`/restaurants/${restaurantId}`)
}

/** Fetches available tables on the floor plan for the specified booking window. */
export async function fetchPublicTablesForBooking(
  restaurantId: string,
  reservedForIso: string,
  partySize: number,
): Promise<FloorPlanViewerTable[]> {
  const tables = await apiClient.get<PublicTableItem[]>(
    `/tables?restaurantId=${encodeURIComponent(restaurantId)}&reservedFor=${encodeURIComponent(reservedForIso)}`,
  )

  return (tables || []).map((t) => {
    let shape: "RECTANGLE" | "SQUARE" | "CIRCLE" = "RECTANGLE"
    if (t.shape === "ROUND" || t.shape === "CIRCLE") shape = "CIRCLE"
    else if (t.shape === "SQUARE") shape = "SQUARE"

    const tableName = t.name || t.number || "Table"

    return {
      id: t.id,
      name: tableName,
      capacity: t.capacity,
      floor: t.floor || "Main Floor",
      section: t.section ?? t.location,
      shape,
      positionX: t.positionX ?? null,
      positionY: t.positionY ?? null,
      width: t.width ?? 140,
      height: t.height ?? 90,
      rotation: t.rotation ?? 0,
      available: t.status === "AVAILABLE" && t.capacity >= partySize,
    }
  })
}

/** Submits the booking request to POST /api/reservations/public-book. */
export async function submitBooking(request: BookingRequest): Promise<BookingConfirmation> {
  // Combine date & time into ISO string
  const reservedForIso = new Date(`${request.date}T${request.time}:00`).toISOString()

  const result = await apiClient.post<{
    id: string
    partySize: number
    reservedFor: string
    status: string
    customer: { name: string; email: string; phone: string | null }
    table?: { id: string; name?: string; number?: string; floor?: string } | null
  }>("/reservations/public-book", {
    restaurantId: request.restaurantId,
    customerName: request.name,
    customerEmail: request.email,
    customerPhone: request.phone || undefined,
    partySize: request.guests,
    reservedFor: reservedForIso,
    tableId: request.tableId || undefined,
    notes: request.notes || undefined,
  })

  return {
    id: result.id,
    restaurantId: request.restaurantId,
    date: request.date,
    time: request.time,
    guests: result.partySize,
    name: result.customer?.name || request.name,
    email: result.customer?.email || request.email,
    phone: result.customer?.phone || request.phone,
    table: result.table
      ? {
          id: result.table.id,
          number: result.table.name || result.table.number || "Table",
          floor: result.table.floor || "Main Floor",
        }
      : null,
    status: result.status,
    notes: request.notes,
    createdAt: new Date().toISOString(),
  }
}
