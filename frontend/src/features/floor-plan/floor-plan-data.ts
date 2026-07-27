export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"

export interface FloorPlanTable {
  id: string
  name: string
  capacity: number
  location?: string
  status: TableStatus
  positionX: number
  positionY: number
}

/**
 * Mock seed data standing in for `GET /api/tables?restaurantId=...`.
 * Replace with a real fetch once the floor plan is wired to the backend
 * (the current Table API does not yet expose positionX/positionY on
 * create/update — see README note in floor-plan-builder.tsx).
 */
export const initialTables: FloorPlanTable[] = [
  { id: "t1", name: "T1", capacity: 2, location: "Window", status: "AVAILABLE", positionX: 40, positionY: 40 },
  { id: "t2", name: "T2", capacity: 6, location: "Main Hall", status: "RESERVED", positionX: 260, positionY: 40 },
  { id: "t3", name: "T3", capacity: 4, location: "Patio", status: "AVAILABLE", positionX: 40, positionY: 200 },
  { id: "t4", name: "T4", capacity: 4, location: "Main Hall", status: "OCCUPIED", positionX: 260, positionY: 200 },
  { id: "t5", name: "T5", capacity: 2, location: "Bar", status: "AVAILABLE", positionX: 480, positionY: 40 },
  { id: "t6", name: "T6", capacity: 8, location: "Private Room", status: "MAINTENANCE", positionX: 480, positionY: 200 },
]
