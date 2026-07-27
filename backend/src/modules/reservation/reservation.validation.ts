import { z } from "zod"

// Public API status values. `CHECKED_IN` maps to the Prisma `SEATED` enum
// value under the hood (see reservation.service.ts) since the schema enum
// cannot be renamed from this module alone.
export const reservationStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
])

export const createReservationSchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  customerId: z.string().min(1, "customerId is required"),
  tableId: z.string().min(1).optional(),
  partySize: z.coerce.number().int().positive("partySize must be a positive integer"),
  reservedFor: z.coerce.date({ error: "reservedFor must be a valid date" }),
  notes: z.string().optional(),
  createdById: z.string().min(1).optional(),
})

export const updateReservationSchema = z.object({
  tableId: z.string().min(1).optional(),
  partySize: z.coerce.number().int().positive().optional(),
  reservedFor: z.coerce.date().optional(),
  notes: z.string().optional(),
})

export const updateReservationStatusSchema = z.object({
  status: reservationStatusEnum,
})

export const checkAvailabilitySchema = z.object({
  restaurantId: z.string().min(1, "restaurantId is required"),
  tableId: z.string().min(1, "tableId is required"),
  reservedFor: z.coerce.date({ error: "reservedFor must be a valid date" }),
  partySize: z.coerce.number().int().positive().optional(),
})
