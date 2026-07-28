import type { FloorPlanTable } from "@/features/floor-plan/floor-plan-data"
import { API_URL } from "@/lib/config"

const STORAGE_KEY = "prosisit:floor-plan:layout"

export type TableLayout = Pick<
  FloorPlanTable,
  "id" | "positionX" | "positionY" | "width" | "height" | "shape" | "rotation" | "floor"
>

/**
 * Persists table layout (position, size, shape, rotation, floor).
 *
 * Attempts the real backend endpoint first — `PATCH /api/tables/layout`
 * (see `backend/src/modules/table/table.routes.ts`), which requires an
 * authenticated session. Since the frontend does not yet have a wired-up
 * login flow, any failure (401, network, no restaurantId) falls back to
 * localStorage so the designer remains fully usable in the meantime. Once
 * auth is wired up, pass a real `restaurantId` and bearer token and this
 * will transparently persist server-side.
 */
export async function savePositions(
  layout: TableLayout[],
  restaurantId?: string,
): Promise<{ persisted: "server" | "local" }> {
  if (restaurantId) {
    try {
      const res = await fetch(`${API_URL}/tables/layout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, tables: layout }),
      })
      if (res.ok) {
        saveLocal(layout)
        return { persisted: "server" }
      }
    } catch {
      // fall through to local persistence
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 250)) // simulate latency
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

