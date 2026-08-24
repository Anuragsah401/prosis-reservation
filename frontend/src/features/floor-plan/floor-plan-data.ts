export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE"
export type TableShape = "RECTANGLE" | "SQUARE" | "CIRCLE"

export type FacilityType =
  | "BAR"
  | "RESTROOM"
  | "ENTRANCE"
  | "EXIT"
  | "KITCHEN"
  | "HOST_STAND"
  | "WALL"
  | "PLANT"

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
  elementType?: "TABLE" | "FACILITY"
  facilityType?: FacilityType
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

export const facilityDefaults: Record<FacilityType, {
  name: string
  width: number
  height: number
  shape: TableShape
  description: string
}> = {
  BAR: {
    name: "Bar & Counter",
    width: 220,
    height: 80,
    shape: "RECTANGLE",
    description: "Cocktail bar counter with bar stools",
  },
  RESTROOM: {
    name: "Restrooms",
    width: 100,
    height: 80,
    shape: "SQUARE",
    description: "Guest restrooms & WC facilities",
  },
  ENTRANCE: {
    name: "Main Entrance",
    width: 120,
    height: 50,
    shape: "RECTANGLE",
    description: "Main entryway with door swing arc",
  },
  EXIT: {
    name: "Emergency Exit",
    width: 100,
    height: 45,
    shape: "RECTANGLE",
    description: "Safety exit / service egress",
  },
  KITCHEN: {
    name: "Kitchen & Pass",
    width: 180,
    height: 90,
    shape: "RECTANGLE",
    description: "Kitchen order pass & staff station",
  },
  HOST_STAND: {
    name: "Host Stand",
    width: 80,
    height: 70,
    shape: "SQUARE",
    description: "Front-of-house check-in podium",
  },
  WALL: {
    name: "Divider Wall",
    width: 160,
    height: 20,
    shape: "RECTANGLE",
    description: "Architectural partition wall",
  },
  PLANT: {
    name: "Planter / Greenery",
    width: 50,
    height: 50,
    shape: "CIRCLE",
    description: "Decorative indoor potted greenery",
  },
}


