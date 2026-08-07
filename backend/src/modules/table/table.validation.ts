import { z } from "zod"

export const tableStatusEnum = z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"])
export const tableShapeEnum = z.enum(["RECTANGLE", "SQUARE", "CIRCLE"])

export const createTableSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  name: z.string().min(1, "name is required"),
  capacity: z.coerce.number().int().positive("capacity must be a positive integer"),
  location: z.string().optional(),
  status: tableStatusEnum.optional(),
  floor: z.string().optional(),
  shape: tableShapeEnum.optional(),
  positionX: z.coerce.number().optional(),
  positionY: z.coerce.number().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  rotation: z.coerce.number().optional(),
})

export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  location: z.string().optional(),
  status: tableStatusEnum.optional(),
  floor: z.string().optional(),
  shape: tableShapeEnum.optional(),
  positionX: z.coerce.number().optional(),
  positionY: z.coerce.number().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  rotation: z.coerce.number().optional(),
})

export const layoutTableSchema = z.object({
  id: z.string().min(1),
  positionX: z.coerce.number(),
  positionY: z.coerce.number(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  shape: tableShapeEnum.optional(),
  rotation: z.coerce.number().optional(),
  floor: z.string().optional(),
})

export const saveLayoutSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  tables: z.array(layoutTableSchema).min(1, "tables must contain at least one entry"),
})

export const syncFloorPlanSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  // An empty array is allowed: it represents a floor plan where every table
  // was removed, and must be able to prune the remaining rows server-side.
  tables: z.array(
    z.object({
      name: z.string().min(1),
      capacity: z.coerce.number().int().positive(),
      location: z.string().nullish(),
      floor: z.string().min(1),
      shape: tableShapeEnum,
      positionX: z.coerce.number(),
      positionY: z.coerce.number(),
      width: z.coerce.number().positive(),
      height: z.coerce.number().positive(),
      rotation: z.coerce.number(),
    }),
  ),
})

