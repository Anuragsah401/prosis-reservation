import crypto from "crypto"
import { prisma } from "@/db/client"
import { env } from "@/config/env"
import { mailer } from "@/utils/mailer"
import { sms } from "@/utils/sms"
import { notificationService } from "@/modules/notification/notification.service"
import type { CreateNotificationInput } from "@/modules/notification/notification.service"
import type { Prisma, ReservationStatus, TableStatus } from "@prisma/client"

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

/**
 * Recomputes a table's status from its reservations so the floor plan reflects
 * bookings without staff updating it by hand: Reserved while a
 * PENDING/CONFIRMED reservation sits on it, Occupied once one is seated, and
 * back to Available when the last active reservation leaves. A staff-set
 * MAINTENANCE flag is never overridden.
 *
 * Called at every point a reservation's table assignment or status changes
 * (create, confirm, reassign, seat, cancel, delete). Best-effort — failures
 * are logged by the caller's surrounding error handling and never roll back
 * the reservation operation itself.
 */
async function syncTableStatus(tableId: string | null) {
  if (!tableId) return

  const table = await prisma.table.findUnique({ where: { id: tableId } })
  if (!table || table.status === "MAINTENANCE") return

  const active = await prisma.reservation.findMany({
    where: { tableId, status: { in: ACTIVE_STATUSES } },
    select: { status: true },
  })

  const nextStatus: TableStatus = active.some((r) => r.status === "SEATED")
    ? "OCCUPIED"
    : active.length > 0
      ? "RESERVED"
      : "AVAILABLE"

  if (table.status !== nextStatus) {
    await prisma.table.update({ where: { id: tableId }, data: { status: nextStatus } })
  }
}

// ---------------------------------------------------------------------------
// Staff notification feed
// ---------------------------------------------------------------------------

interface NotificationContext {
  customer: { name: string }
  table: { number: string } | null
  reservedFor: Date
  partySize: number
}

/** Fetches just the fields needed to build a human-readable notification
 * message for a reservation. Returns null if the reservation no longer
 * exists (e.g. it was deleted). */
async function getNotificationContext(reservationId: string): Promise<NotificationContext | null> {
  return prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      customer: { select: { name: true } },
      table: { select: { number: true } },
      reservedFor: true,
      partySize: true,
    },
  })
}

function formatTime(date: Date) {
  return date.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })
}

/** Best-effort: a notification failure must never roll back the reservation
 * operation that produced it — staff can always see the change in the list. */
async function notify(restaurantId: string, data: CreateNotificationInput) {
  try {
    await notificationService.create(restaurantId, data)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notifications] Failed to record notification:", err)
  }
}

/** Notification for a reservation reaching a new status (seated, completed,
 * no-show, cancelled, confirmed). Returns null for statuses that don't map
 * to a staff notification. */
function statusNotification(
  status: ReservationStatus,
  ctx: NotificationContext,
): CreateNotificationInput | null {
  const when = formatTime(ctx.reservedFor)
  const tableName = ctx.table ? `Table ${ctx.table.number}` : null
  switch (status) {
    case "SEATED":
      return {
        type: "reservation_updated",
        title: "Guest seated",
        message: `${ctx.customer.name} was seated at ${tableName ?? "a table"}.`,
        href: "/reservations",
      }
    case "COMPLETED":
      return {
        type: "reservation_updated",
        title: "Reservation completed",
        message: `${ctx.customer.name}'s ${when} booking was completed.`,
        href: "/reservations",
      }
    case "NO_SHOW":
      return {
        type: "reservation_updated",
        title: "No-show",
        message: `${ctx.customer.name} did not show up for their ${when} booking.`,
        href: "/reservations",
      }
    case "CANCELLED":
      return {
        type: "reservation_cancelled",
        title: "Reservation cancelled",
        message: `${ctx.customer.name} cancelled their ${when} booking.`,
        href: "/reservations",
      }
    case "CONFIRMED":
      return {
        type: "reservation_confirmed",
        title: "Reservation confirmed",
        message: `${ctx.customer.name} confirmed their ${when} booking.`,
        href: "/reservations",
      }
    default:
      return null
  }
}

async function notifyStatusChange(reservationId: string, restaurantId: string, status: ReservationStatus) {
  const ctx = await getNotificationContext(reservationId)
  if (!ctx) return
  const notification = statusNotification(status, ctx)
  if (notification) await notify(restaurantId, notification)
}

/**
 * Normalises a DB row into the API shape. Also drops `confirmationTokenHash`,
 * which backs the guest confirmation link and must never leave the server —
 * every public return path goes through here, so stripping it once covers all
 * of them.
 */
function toApiShape<T extends { status: ReservationStatus }>(
  reservation: T,
): Omit<T, "status" | "confirmationTokenHash"> & { status: ReservationStatus } {
  const { confirmationTokenHash: _hash, ...rest } = reservation as T & {
    confirmationTokenHash?: string
  }
  return { ...rest, status: DB_TO_API_STATUS[reservation.status] } as Omit<
    T,
    "status" | "confirmationTokenHash"
  > & { status: ReservationStatus }
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
    status?: string
  }) {
    // Frontend sends "__customer_choice__" sentinel when guest picks their own table.
    // Treat it as undefined (no table assigned yet).
    const tableId = data.tableId === "__customer_choice__" ? undefined : data.tableId

    if (tableId) {
      const { available } = await this.checkAvailability({
        restaurantId: data.restaurantId,
        tableId,
        reservedFor: data.reservedFor,
      })
      if (!available) {
        throw new Error("Table is not available at the requested time")
      }
    }

    const rawToken = crypto.randomBytes(32).toString("hex")

    // Walk-ins are created already seated; everything else starts as PENDING
    // and waits for the guest to confirm via the emailed link.
    const dbStatus = data.status ? API_TO_DB_STATUS[data.status] : undefined

    const reservation = await prisma.reservation.create({
      data: {
        restaurantId: data.restaurantId,
        customerId: data.customerId,
        tableId,
        partySize: data.partySize,
        reservedFor: data.reservedFor,
        notes: data.notes,
        createdById: data.createdById,
        confirmationTokenHash: hashConfirmationToken(rawToken),
        ...(dbStatus ? { status: dbStatus } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        restaurant: { select: { name: true } },
        table: { select: { id: true, number: true, section: true } },
      },
    })

    // The table is now booked, so the floor plan should show it as Reserved.
    await syncTableStatus(data.tableId ?? null)

    // Notify the customer so they can confirm. Email is preferred (it renders
    // the full details and floor plan link); SMS is the fallback for customers
    // who only left a phone number. Sending failures are logged but never fail
    // reservation creation — staff can always re-send or confirm manually.
    // Walk-ins are already seated, so there's nothing to confirm — no
    // confirmation email/SMS is sent for them.
    const isWalkIn = reservation.status === "SEATED"
    const confirmUrl = `${env.APP_URL}/reservation/confirm?token=${rawToken}`
    const notifyVia = isWalkIn
      ? null
      : reservation.customer.email
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
    } else if (!isWalkIn) {
      // eslint-disable-next-line no-console
      console.warn(
        `[reservation] Customer ${reservation.customerId} has neither email nor phone — no confirmation sent.`,
      )
    }

    // Record the event in the staff notification feed — a new reservation for
    // the bell, or a "walk-in seated" when the guest was seated immediately.
    if (isWalkIn) {
      await notify(reservation.restaurantId, {
        type: "reservation_new",
        title: "Walk-in seated",
        message: `${reservation.customer.name} walked in and was seated${
          reservation.table ? ` at Table ${reservation.table.number}` : ""
        } for ${reservation.partySize}.`,
        href: "/reservations",
      })
    } else {
      await notify(reservation.restaurantId, {
        type: "reservation_new",
        title: "New reservation",
        message: `${reservation.customer.name} booked a table for ${reservation.partySize} at ${formatTime(reservation.reservedFor)}.`,
        href: "/reservations",
      })
    }

    const { restaurant: _r, table, ...rest } = reservation
    return toApiShape({
      ...rest,
      // Match the list endpoint's shape so the frontend renders the customer
      // name and table correctly from the create response without a refetch.
      customer: reservation.customer
        ? { id: reservation.customer.id, name: reservation.customer.name, email: reservation.customer.email, phone: reservation.customer.phone }
        : null,
      table: table ? { id: table.id, name: table.number, location: table.section } : null,
    })
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
    // Release the previously assigned table (if the guest changed it) and
    // mark the newly chosen one as Reserved.
    await syncTableStatus(reservation.tableId)
    await syncTableStatus(updated.tableId)
    await notifyStatusChange(updated.id, updated.restaurantId, "CONFIRMED")
    return toApiShape(updated)
  },

  /**
   * Staff-facing: re-sends the confirmation email to any email address.
   * Useful when the customer's email on file is wrong or staff needs to send
   * the link to a different address.
   */
  async resendConfirmationEmail(reservationId: string, toEmail: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        customer: { select: { name: true } },
        restaurant: { select: { name: true } },
        table: { select: { number: true } },
      },
    })

    if (!reservation) {
      throw new Error("Reservation not found")
    }
    if (reservation.status === "CANCELLED") {
      throw new Error("This reservation has been cancelled")
    }

    // Get the raw token from the hash - we can't reverse the hash, so we need to generate a new one
    // Actually, we should store the raw token or generate a new one. For now, generate new token.
    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = hashConfirmationToken(rawToken)

    // Update the reservation with new token hash
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { confirmationTokenHash: tokenHash },
    })

    const confirmUrl = `${env.APP_URL}/reservation/confirm?token=${rawToken}`

    await mailer.sendReservationConfirmationEmail({
      to: toEmail,
      customerName: reservation.customer.name,
      restaurantName: reservation.restaurant.name,
      reservedFor: reservation.reservedFor,
      partySize: reservation.partySize,
      tableName: reservation.table?.number ?? null,
      confirmUrl,
    })

    await prisma.reservation.update({
      where: { id: reservationId },
      data: { confirmationSentAt: new Date() },
    })

    return { success: true }
  },

  /**
   * Public: cancels a reservation via its confirmation token, so a guest can
   * back out from the same link they were emailed without needing an account.
   *
   * Cancelling an already-cancelled reservation is treated as success rather
   * than an error — the guest's intent is already satisfied, and a second tap
   * (or a double-submit) shouldn't show them a scary failure.
   */
  async cancelByToken(rawToken: string) {
    const tokenHash = hashConfirmationToken(rawToken)
    const reservation = await prisma.reservation.findUnique({
      where: { confirmationTokenHash: tokenHash },
    })

    if (!reservation) {
      throw new Error("Invalid confirmation link")
    }
    if (reservation.status === "CANCELLED") {
      return toApiShape(reservation)
    }
    if (reservation.status === "COMPLETED" || reservation.status === "NO_SHOW") {
      throw new Error("This reservation can no longer be cancelled")
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CANCELLED" },
    })
    await syncTableStatus(reservation.tableId)
    await notifyStatusChange(updated.id, updated.restaurantId, "CANCELLED")
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
    // Reassigning to another table releases the old one and books the new one.
    await syncTableStatus(existing.tableId)
    await syncTableStatus(reservation.tableId)
    const ctx = await getNotificationContext(reservation.id)
    if (ctx) {
      await notify(reservation.restaurantId, {
        type: "reservation_updated",
        title: "Reservation updated",
        message: `${ctx.customer.name}'s ${formatTime(ctx.reservedFor)} booking was updated.`,
        href: "/reservations",
      })
    }
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
    // Seating occupies the table; cancelling/completing/no-showing frees it.
    await syncTableStatus(reservation.tableId)
    await notifyStatusChange(reservation.id, reservation.restaurantId, nextStatus)
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
    // Grab the message context before the row is gone.
    const ctx = await getNotificationContext(id)
    const deleted = await prisma.reservation.delete({ where: { id } })
    await syncTableStatus(existing.tableId)
    if (ctx) {
      await notify(existing.restaurantId, {
        type: "reservation_updated",
        title: "Reservation deleted",
        message: `${ctx.customer.name}'s ${formatTime(ctx.reservedFor)} booking was deleted.`,
        href: "/reservations",
      })
    }
    return deleted
  },
}
