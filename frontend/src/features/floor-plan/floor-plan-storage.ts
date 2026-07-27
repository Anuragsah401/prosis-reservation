import type { FloorPlanTable } from "@/features/floor-plan/floor-plan-data"

const STORAGE_KEY = "prosisit:floor-plan:positions"

export type TablePosition = Pick<FloorPlanTable, "id" | "positionX" | "positionY">

/**
 * Persists table positions.
 *
 * NOTE: This currently saves to localStorage as a placeholder. The backend's
 * table update endpoint (PATCH /api/tables/:id) does not yet accept
 * positionX/positionY — only name, capacity, location, and status. Once the
 * backend exposes those fields, replace this function's body with a
 * PATCH request per table (or a dedicated bulk endpoint) without changing
 * its signature, so callers (floor-plan-builder.tsx) don't need to change.
 */
export async function savePositions(positions: TablePosition[]): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300)) // simulate network latency
  const existing = loadPositions()
  const merged = { ...existing }
  for (const pos of positions) {
    merged[pos.id] = { positionX: pos.positionX, positionY: pos.positionY }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function loadPositions(): Record<string, { positionX: number; positionY: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
