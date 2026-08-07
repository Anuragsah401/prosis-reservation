import crypto from "crypto"
import { prisma } from "@/db/client"
import { env } from "@/config/env"
import { mailer } from "@/utils/mailer"
import { sms } from "@/utils/sms"
import type { Prisma, ReservationStatus } from "@prisma/client"

// Default duration a table is considered occupied by a single reservation,
// used for overlap detection in availability checks.
const RESERVATION_DURATION_MINUTES = 90

function hashConfirmationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

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
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        table: { select: { id: true, number: true, section: true } },
      },
    })
    return reservations.map((r) => {
      const { table, ...rest } = r
      return toApiShape({
        ...rest,
        table: table ? { id: table.id, name: table.number, location: table.section } : null,
      })
    })
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

    const rawToken = crypto.randomBytes(32).toString("hex")

    const reservation = await prisma.reservation.create({
      data: {
        restaurantId: data.restaurantId,
        customerId: data.customerId,
        tableId: data.tableId,
        partySize: data.partySize,
        reservedFor: data.reservedFor,
        notes: data.notes,
        createdById: data.createdById,
        confirmationTokenHash: hashConfirmationToken(rawToken),
      },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        restaurant: { select: { name: true } },
        table: { select: { number: true } },
      },
    })

    // Notify the customer so they can confirm. Email is preferred (it renders
    // the full details and floor plan link); SMS is the fallback for customers
    // who only left a phone number. Sending failures are logged but never fail
    // reservation creation — staff can always re-send or confirm manually.
    const confirmUrl = `${env.APP_URL}/reservation/confirm?token=${rawToken}`
    const notifyVia = reservation.customer.email
      ? "email"
      : reservation.customer.phone
        ? "sms"
        : null

    if (notifyVia) {
      try {
        if (notifyVia === "email") {
          await mailer.sendReservationConfirmationEmail({
            to: reservation.customer.email as string,
            customerName: reservation.customer.name,
            restaurantName: reservation.restaurant.name,
            reservedFor: reservation.reservedFor,
            partySize: reservation.partySize,
            tableName: reservation.table?.number ?? null,
            confirmUrl,
          })
        } else {
          await sms.sendReservationConfirmationSms({
            to: reservation.customer.phone as string,
            customerName: reservation.customer.name,
            restaurantName: reservation.restaurant.name,
            reservedFor: reservation.reservedFor,
            partySize: reservation.partySize,
            confirmUrl,
          })
        }
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { confirmationSentAt: new Date() },
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[reservation] Failed to send confirmation ${notifyVia}:`, err)
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[reservation] Customer ${reservation.customerId} has neither email nor phone — no confirmation sent.`,
      )
    }

    const { customer: _c, restaurant: _r, table: _t, ...rest } = reservation
    return toApiShape(rest)
  },

  /**
   * Public: looks up a reservation by its confirmation token, returning the
   * details a guest needs to confirm (restaurant, time, party size, current
   * table) plus the restaurant's tables so they can optionally choose one
   * from the floor plan.
   */
  async getByConfirmationToken(rawToken: string) {
    const tokenHash = hashConfirmationToken(rawToken)
    const reservation = await prisma.reservation.findUnique({
      where: { confirmationTokenHash: tokenHash },
      include: {
        customer: { select: { name: true } },
        restaurant: { select: { id: true, name: true } },
        table: { select: { id: true, number: true, capacity: true, floor: true } },
      },
    })

    if (!reservation) {
      throw new Error("Invalid confirmation link")
    }
    if (reservation.status === "CANCELLED") {
      throw new Error("This reservation has been cancelled")
    }

    // Tables the guest can choose from: enough capacity and free at the
    // reservation time (plus their currently assigned table).
    const tables = await prisma.table.findMany({
      where: { restaurantId: reservation.restaurantId },
      select: {
        id: true,
        number: true,
        capacity: true,
        floor: true,
        section: true,
        shape: true,
        positionX: true,
        positionY: true,
        width: true,
        height: true,
        rotation: true,
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    })

    const windowStart = new Date(reservation.reservedFor.getTime() - RESERVATION_DURATION_MINUTES * 60_000)
    const windowEnd = new Date(reservation.reservedFor.getTime() + RESERVATION_DURATION_MINUTES * 60_000)
    const conflicts = await prisma.reservation.findMany({
      where: {
        restaurantId: reservation.restaurantId,
        id: { not: reservation.id },
        tableId: { not: null },
        status: { in: ACTIVE_STATUSES },
        reservedFor: { gte: windowStart, lte: windowEnd },
      },
      select: { tableId: true },
    })
    const occupiedTableIds = new Set(conflicts.map((c) => c.tableId))

    return {
      reservation: {
        id: reservation.id,
        customerName: reservation.customer.name,
        restaurantName: reservation.restaurant.name,
        reservedFor: reservation.reservedFor,
        partySize: reservation.partySize,
        status: DB_TO_API_STATUS[reservation.status],
        confirmedAt: reservation.confirmedAt,
        table: reservation.table
          ? { id: reservation.table.id, name: reservation.table.number, floor: reservation.table.floor }
          : null,
      },
      tables: tables.map((t) => ({
        ...t,
        name: t.number,
        available: !occupiedTableIds.has(t.id) && t.capacity >= reservation.partySize,
      })),
    }
  },

  /**
   * Public: confirms a reservation via its confirmation token, optionally
   * moving it to a different (available) table chosen by the guest.
   */
  async confirmByToken(rawToken: string, tableId?: string) {
    const tokenHash = hashConfirmationToken(rawToken)
    const reservation = await prisma.reservation.findUnique({
      where: { confirmationTokenHash: tokenHash },
    })

    if (!reservation) {
      throw new Error("Invalid confirmation link")
    }
    if (reservation.status === "CANCELLED") {
      throw new Error("This reservation has been cancelled")
    }
    if (reservation.confirmedAt) {
      throw new Error("This reservation is already confirmed")
    }

    if (tableId && tableId !== reservation.tableId) {
      const table = await prisma.table.findFirst({
        where: { id: tableId, restaurantId: reservation.restaurantId },
      })
      if (!table) {
        throw new Error("Selected table not found")
      }
      if (table.capacity < reservation.partySize) {
        throw new Error("Selected table is too small for your party")
      }
      const { available } = await this.checkAvailability({
        restaurantId: reservation.restaurantId,
        tableId,
        reservedFor: reservation.reservedFor,
      })
      if (!available) {
        throw new Error("Table is not available at the requested time")
      }
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        ...(tableId ? { tableId } : {}),
      },
    })
    return toApiShape(updated)
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
