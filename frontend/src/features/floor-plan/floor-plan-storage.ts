import type { FloorPlanTable } from "@/features/floor-plan/floor-plan-data"
import { DEFAULT_TABLE_WIDTH, DEFAULT_TABLE_HEIGHT } from "@/features/floor-plan/floor-plan-data"
import { apiClient, getCurrentRestaurantId } from "@/lib/api-client"

const STORAGE_KEY = "prosisit:floor-plan:layout"

export type TableLayout = Pick<
  FloorPlanTable,
  | "id"
  | "positionX"
  | "positionY"
  | "width"
  | "height"
  | "shape"
  | "rotation"
  | "floor"
  | "elementType"
  | "facilityType"
  | "groupId"
  | "groupName"
>

export interface FloorPlanSyncTable {
  name: string
  capacity: number
  location?: string | null
  floor: string
  shape: FloorPlanTable["shape"]
  positionX: number
  positionY: number
  width: number
  height: number
  rotation: number
  groupId?: string | null
  groupName?: string | null
}

/**
 * Syncs the complete floor plan to the backend (`PUT /api/tables/floor-plan`),
 * upserting tables by name and pruning removed ones. This is what makes the
 * plan visible to guests on the public reservation-confirmation page, which
 * reads tables from the database. Requires an authenticated session with a
 * restaurantId; resolves to false when unavailable (plan stays local-only).
 */
export async function syncFloorPlanToServer(
  tables: (FloorPlanSyncTable & { elementType?: "TABLE" | "FACILITY"; facilityType?: string })[],
): Promise<boolean> {
  const restaurantId = getCurrentRestaurantId()
  // An empty array is still a valid plan (all tables removed), so it is
  // synced too — otherwise deletions would never reach the database.
  if (!restaurantId) return false
  try {
    const payloadTables = tables.map((t) => ({
      name: t.name,
      capacity: t.elementType === "FACILITY" ? 0 : t.capacity,
      location: t.elementType === "FACILITY" ? `FACILITY:${t.facilityType || "BAR"}` : t.location,
      floor: t.floor,
      shape: t.shape,
      positionX: t.positionX,
      positionY: t.positionY,
      width: t.width,
      height: t.height,
      rotation: t.rotation,
      groupId: t.groupId ?? null,
      groupName: t.groupName ?? null,
    }))
    await apiClient.put(`/tables/floor-plan`, { restaurantId, tables: payloadTables })
    return true
  } catch (err) {
    console.error("[floor-plan] Failed to sync floor plan to backend:", err)
    return false
  }
}

/** A table as returned by `GET /api/tables?restaurantId=...`. */
interface ApiTable {
  id: string
  name: string
  capacity: number
  location: string | null
  section?: string | null
  floor: string
  shape: FloorPlanTable["shape"]
  positionX: number | null
  positionY: number | null
  width: number | null
  height: number | null
  rotation: number | null
  status: FloorPlanTable["status"]
  groupId?: string | null
  groupName?: string | null
}

export interface FacilityInspectable {
  name?: string | null
  capacity?: number | null
  location?: string | null
  section?: string | null
  elementType?: string | null
  facilityType?: FloorPlanTable["facilityType"] | null
}

/**
 * Returns true if an item represents an architectural restaurant facility element
 * rather than a bookable dining table.
 */
export function isFacilityElement(table?: FacilityInspectable | null): boolean {
  if (!table) return false
  if (table.elementType === "FACILITY" || Boolean(table.facilityType)) return true
  if (table.location?.startsWith("FACILITY:") || table.section?.startsWith("FACILITY:")) return true
  if (table.capacity === 0) return true
  const n = (table.name || "").toLowerCase()
  if (
    n.includes("bar") ||
    n.includes("restroom") ||
    n.includes("toilet") ||
    n.includes("wc") ||
    n.includes("entrance") ||
    n.includes("entry") ||
    n.includes("exit") ||
    n.includes("kitchen") ||
    n.includes("host") ||
    n.includes("stage") ||
    n.includes("dj") ||
    n.includes("buffet") ||
    n.includes("stair") ||
    n.includes("wall") ||
    n.includes("divider") ||
    n.includes("plant") ||
    n.includes("planter")
  ) {
    if (table.capacity === 0 || table.capacity === undefined || table.capacity === null) {
      return true
    }
  }
  return false
}

/**
 * Resolves the concrete FacilityType from metadata or names.
 */
export function resolveFacilityType(table: FacilityInspectable): FloorPlanTable["facilityType"] {
  if (table.facilityType) return table.facilityType
  const loc = table.location || table.section
  if (loc?.startsWith("FACILITY:")) {
    return loc.replace("FACILITY:", "") as FloorPlanTable["facilityType"]
  }
  const n = (table.name || "").toLowerCase()
  if (n.includes("bar")) return "BAR"
  if (n.includes("restroom") || n.includes("toilet") || n.includes("wc")) return "RESTROOM"
  if (n.includes("entrance") || n.includes("entry")) return "ENTRANCE"
  if (n.includes("exit")) return "EXIT"
  if (n.includes("kitchen")) return "KITCHEN"
  if (n.includes("host")) return "HOST_STAND"
  if (n.includes("wall") || n.includes("divider")) return "WALL"
  if (n.includes("plant") || n.includes("planter")) return "PLANT"
  return "BAR"
}

/**
 * Loads the saved floor plan from the backend, which is the only shared
 * source of truth across devices — localStorage is per-browser, so a layout
 * arranged on a desktop is invisible on a phone until it's read from here.
 *
 * Returns null when there's no restaurant context or the request fails, so
 * callers can fall back to whatever is cached locally rather than showing an
 * empty canvas.
 */
export async function fetchFloorPlanFromServer(reservedFor?: string): Promise<FloorPlanTable[] | null> {
  const restaurantId = getCurrentRestaurantId()
  if (!restaurantId) return null
  try {
    const qs = new URLSearchParams({ restaurantId })
    if (reservedFor) {
      qs.set("reservedFor", reservedFor)
    }
    const tables = await apiClient.get<ApiTable[]>(`/tables?${qs.toString()}`)
    return tables.map((t) => {
      const isFacility = isFacilityElement(t)
      const extractedFacilityType = isFacility ? resolveFacilityType(t) : undefined

      return {
        id: t.id,
        name: t.name,
        capacity: isFacility ? 0 : t.capacity,
        location: isFacility ? undefined : (t.location ?? undefined),
        status: t.status ?? "AVAILABLE",
        floor: t.floor || "Main Floor",
        shape: t.shape ?? "RECTANGLE",
        positionX: t.positionX ?? 40,
        positionY: t.positionY ?? 40,
        width: t.width || DEFAULT_TABLE_WIDTH,
        height: t.height || DEFAULT_TABLE_HEIGHT,
        rotation: t.rotation ?? 0,
        elementType: isFacility ? "FACILITY" : "TABLE",
        facilityType: extractedFacilityType,
        groupId: t.groupId ?? null,
        groupName: t.groupName ?? null,
      }
    })
  } catch (err) {
    console.error("[floor-plan] Failed to load floor plan from backend:", err)
    return null
  }
}

/**
 * Persists table layout (position, size, shape, rotation, floor, group).
 *
 * Attempts the real backend endpoint first — `PATCH /api/tables/layout`
 * (see `backend/src/modules/table/table.routes.ts`), which requires an
 * authenticated session.
 */
export async function savePositions(
  layout: TableLayout[],
  restaurantId?: string,
): Promise<{ persisted: "server" | "local" }> {
  const effectiveRestaurantId = restaurantId || getCurrentRestaurantId()
  if (effectiveRestaurantId) {
    try {
      await apiClient.patch(`/tables/layout`, { restaurantId: effectiveRestaurantId, tables: layout })
      saveLocal(layout)
      return { persisted: "server" }
    } catch {
      // fall through to local persistence
    }
  }

  saveLocal(layout)
  return { persisted: "local" }
}

function saveLocal(layout: TableLayout[]) {
  const existing = loadPositions()
  const merged = { ...existing }
  for (const t of layout) {
    merged[t.id] = {
      positionX: t.positionX,
      positionY: t.positionY,
      width: t.width,
      height: t.height,
      shape: t.shape,
      rotation: t.rotation,
      floor: t.floor,
      elementType: t.elementType,
      facilityType: t.facilityType,
      groupId: t.groupId,
      groupName: t.groupName,
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function loadPositions(): Record<string, Partial<TableLayout>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const FLOOR_NAMES_KEY = "prosisit:floor-plan:floors"

/**
 * Persists the ordered list of floor names configured in the Floor Plan
 * builder (e.g. "Main Floor", "Patio", or any custom floors added via
 * "Add floor"). Other features — like the reservations calendar's Diagram
 * view — read this to label their floor groupings, so a floor added here
 * shows up there too instead of a hardcoded name.
 */
export function saveFloorNames(floors: string[]) {
  try {
    localStorage.setItem(FLOOR_NAMES_KEY, JSON.stringify(floors))
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

export function loadFloorNames(): string[] | null {
  try {
    const raw = localStorage.getItem(FLOOR_NAMES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const FLOOR_TABLES_KEY = "prosisit:floor-plan:tables"

export interface FloorPlanTableSummary {
  id: string
  name: string
  floor: string
  capacity: number
  status?: FloorPlanTable["status"]
  elementType?: "TABLE" | "FACILITY"
  facilityType?: FloorPlanTable["facilityType"]
  groupId?: string | null
  groupName?: string | null
}

/**
 * Persists a lightweight summary (id/name/floor) of every table configured
 * in the Floor Plan builder. The reservations calendar's Diagram/Timeline
 * view reads this to show each floor's actual table numbers/names instead
 * of its own hardcoded mock table names.
 */
export function saveFloorPlanTables(tables: FloorPlanTableSummary[]) {
  try {
    localStorage.setItem(FLOOR_TABLES_KEY, JSON.stringify(tables))
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

export function loadFloorPlanTables(): FloorPlanTableSummary[] | null {
  try {
    const raw = localStorage.getItem(FLOOR_TABLES_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}


