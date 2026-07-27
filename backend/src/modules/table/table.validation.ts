import { z } from "zod"

export const tableStatusEnum = z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"])

export const createTableSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  name: z.string().min(1, "name is required"),
  capacity: z.coerce.number().int().positive("capacity must be a positive integer"),
  location: z.string().optional(),
  status: tableStatusEnum.optional(),
})

export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  location: z.string().optional(),
  status: tableStatusEnum.optional(),
})
