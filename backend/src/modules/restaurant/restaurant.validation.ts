import { z } from "zod"

export const createRestaurantSchema = z.object({
  name: z.string().min(1, "name is required"),
  slug: z
    .string()
    .min(1, "slug is required")
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with dashes"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
})

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  /** Opening time as minutes from midnight (0-1439). */
  openingTime: z.number().int().min(0).max(1439).optional(),
  /** Closing time as minutes from midnight (1-1440). */
  closingTime: z.number().int().min(1).max(1440).optional(),
  isActive: z.boolean().optional(),
})
