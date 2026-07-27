import { prisma } from "@/db/client"
import type { Prisma, ReservationStatus } from "@prisma/client"

// Default duration a table is considered occupied by a single reservation,
// used for overlap detection in availability checks.
const RESERVATION_DURATION_MINUTES = 90

// Public API uses `CHECKED_IN`; the Prisma enum stores this as `SEATED`.
const API_TO_DB_STATUS: Record<string, ReservationStatus> = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "SEATED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
}

const DB_TO_API_STATUS: Record<ReservationStatus, string> = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  SEATED: "CHECKED_IN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
}

// Statuses that still occupy a table (used for availability + overlap checks).
const ACTIVE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED", "SEATED"]

function toApiShape<T extends { status: ReservationStatus }>(reservation: T) {
  return { ...reservation, status: DB_TO_API_STATUS[reservation.status] }
}

// Valid forward transitions for reservation status updates.
const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["SEATED", "CANCELLED", "NO_SHOW"],
  SEATED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export const reservationService = {
  async list(restaurantId: string) {
    const reservations = await prisma.reservation.findMany({
      where: { restaurantId },
      orderBy: { reservedFor: "asc" },
    })
    return reservations.map(toApiShape)
  },

  async getById(id: string) {
    const reservation = await prisma.reservation.findUnique({ where: { id } })
    return reservation ? toApiShape(reservation) : null
  },

  /**
   * Checks whether a table is free at the requested time, accounting for the
   * default reservation duration window. Returns availability plus any
   * conflicting reservation.
   */
  async checkAvailability(data: { restaurantId: string; tableId: string; reservedFor: Date }) {
    const windowStart = new Date(data.reservedFor.getTime() - RESERVATION_DURATION_MINUTES * 60_000)
    const windowEnd = new Date(data.reservedFor.getTime() + RESERVATION_DURATION_MINUTES * 60_000)

    const conflict = await prisma.reservation.findFirst({
      where: {
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        status: { in: ACTIVE_STATUSES },
        reservedFor: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { reservedFor: "asc" },
    })

    return {
      available: !conflict,
      conflictingReservation: conflict ? toApiShape(conflict) : null,
    }
  },

  async create(data: {
    restaurantId: string
    customerId: string
    tableId?: string
    partySize: number
    reservedFor: Date
    notes?: string
    createdById?: string
  }) {
    if (data.tableId) {
      const { available } = await this.checkAvailability({
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        reservedFor: data.reservedFor,
      })
      if (!available) {
        throw new Error("Table is not available at the requested time")
      }
    }

    const reservation = await prisma.reservation.create({
      data: {
        restaurantId: data.restaurantId,
        customerId: data.customerId,
        tableId: data.tableId,
        partySize: data.partySize,
        reservedFor: data.reservedFor,
        notes: data.notes,
        createdById: data.createdById,
      },
    })
    return toApiShape(reservation)
  },

  async update(
    id: string,
    data: Partial<{
      tableId: string
      partySize: number
      reservedFor: Date
      notes: string
    }>,
  ) {
    const existing = await prisma.reservation.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Reservation not found")
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: data as Prisma.ReservationUpdateInput,
    })
    return toApiShape(reservation)
  },

  /**
   * Updates the reservation status, enforcing valid transitions
   * (e.g. a COMPLETED reservation cannot move back to PENDING).
   */
  async updateStatus(id: string, apiStatus: string) {
    const existing = await prisma.reservation.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Reservation not found")
    }

    const nextStatus = API_TO_DB_STATUS[apiStatus]
    if (!nextStatus) {
      throw new Error("Invalid status")
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status]
    if (existing.status !== nextStatus && !allowed.includes(nextStatus)) {
      throw new Error(
        `Cannot transition reservation from ${DB_TO_API_STATUS[existing.status]} to ${apiStatus}`,
      )
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: nextStatus },
    })
    return toApiShape(reservation)
  },

  async cancel(id: string) {
    return this.updateStatus(id, "CANCELLED")
  },

  async remove(id: string) {
    const existing = await prisma.reservation.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Reservation not found")
    }
    return prisma.reservation.delete({ where: { id } })
  },
}
