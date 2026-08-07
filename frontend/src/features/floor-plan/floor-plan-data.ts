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

