export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
export type TableShape = "RECTANGLE" | "SQUARE" | "CIRCLE"

export interface FloorPlanTable {
  id: string
  name: string
  capacity: number
  location?: string
  status: TableStatus
  floor: string
  shape: TableShape
  positionX: number
  positionY: number
  width: number
  height: number
  rotation: number
}

export const DEFAULT_TABLE_WIDTH = 140
export const DEFAULT_TABLE_HEIGHT = 90

/**
 * Mock seed data standing in for `GET /api/tables?restaurantId=...`.
 * The backend now persists shape/width/height/rotation/floor (see
 * `prisma/schema.prisma` Table model + `table.service.ts`), so once a real
 * restaurant/auth session exists in the frontend, replace this with a fetch
 * and swap `floor-plan-storage.ts` to hit `PATCH /api/tables/layout`
 * (already implemented server-side).
 */
export const initialTables: FloorPlanTable[] = [
  { id: "t1", name: "T1", capacity: 2, location: "Window", status: "AVAILABLE", floor: "Main Floor", shape: "SQUARE", positionX: 40, positionY: 40, width: 100, height: 100, rotation: 0 },
  { id: "t2", name: "T2", capacity: 6, location: "Main Hall", status: "RESERVED", floor: "Main Floor", shape: "RECTANGLE", positionX: 260, positionY: 40, width: 160, height: 90, rotation: 0 },
  { id: "t3", name: "T3", capacity: 4, location: "Patio", status: "AVAILABLE", floor: "Main Floor", shape: "CIRCLE", positionX: 40, positionY: 220, width: 110, height: 110, rotation: 0 },
  { id: "t4", name: "T4", capacity: 4, location: "Main Hall", status: "OCCUPIED", floor: "Main Floor", shape: "RECTANGLE", positionX: 480, positionY: 40, width: 140, height: 90, rotation: 0 },
  { id: "t5", name: "T5", capacity: 2, location: "Bar", status: "AVAILABLE", floor: "Main Floor", shape: "CIRCLE", positionX: 260, positionY: 220, width: 100, height: 100, rotation: 0 },
  { id: "t6", name: "T6", capacity: 8, location: "Private Room", status: "MAINTENANCE", floor: "Main Floor", shape: "RECTANGLE", positionX: 480, positionY: 220, width: 180, height: 100, rotation: 0 },
  { id: "t7", name: "P1", capacity: 4, location: "Terrace", status: "AVAILABLE", floor: "Patio", shape: "SQUARE", positionX: 40, positionY: 40, width: 110, height: 110, rotation: 0 },
  { id: "t8", name: "P2", capacity: 6, location: "Terrace", status: "AVAILABLE", floor: "Patio", shape: "CIRCLE", positionX: 260, positionY: 40, width: 120, height: 120, rotation: 0 },
]

export const shapeLabels: Record<TableShape, string> = {
  RECTANGLE: "Rectangle",
  SQUARE: "Square",
  CIRCLE: "Circle",
}

export const statusLabels: Record<TableStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  MAINTENANCE: "Maintenance",
}

