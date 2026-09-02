import crypto from "crypto"
import { prisma } from "@/db/client"
import { env } from "@/config/env"
import { mailer } from "@/utils/mailer"
import { sms } from "@/utils/sms"
import { notificationService } from "@/modules/notification/notification.service"
import type { CreateNotificationInput } from "@/modules/notification/notification.service"
import { realtimeService } from "@/modules/realtime/realtime.service"
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

  try {
    const table = await prisma.table.findUnique({ where: { id: tableId } })
    if (!table) return

    let tablesInGroup = [table]
    if (table.groupId) {
      try {
        tablesInGroup = await prisma.table.findMany({
          where: { restaurantId: table.restaurantId, groupId: table.groupId },
        })
      } catch {
        tablesInGroup = [table]
      }
    }

    const tableIds = tablesInGroup.map((t) => t.id)

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const active = await prisma.reservation.findMany({
      where: {
        tableId: { in: tableIds },
        status: { in: ACTIVE_STATUSES },
        reservedFor: { gte: startOfToday, lte: endOfToday },
      },
      select: { status: true },
    })

    const nextStatus: TableStatus = active.some((r) => r.status === "SEATED")
      ? "OCCUPIED"
      : active.length > 0
        ? "RESERVED"
        : "AVAILABLE"

    for (const t of tablesInGroup) {
      if (t.status === "MAINTENANCE") continue
      if (t.status !== nextStatus) {
        await prisma.table.update({ where: { id: t.id }, data: { status: nextStatus } })
        realtimeService.broadcastToRestaurant(t.restaurantId, "TABLE_UPDATED", { tableId: t.id, status: nextStatus })
      }
    }
  } catch (err) {
    console.warn("[syncTableStatus] Non-fatal status sync warning:", err)
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

function formatReservationDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
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
  const when = formatReservationDateTime(ctx.reservedFor)
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
        message: `${ctx.customer.name}'s booking for ${when} was completed.`,
        href: "/reservations",
      }
    case "NO_SHOW":
      return {
        type: "reservation_updated",
        title: "No-show",
        message: `${ctx.customer.name} did not show up for their booking on ${when}.`,
        href: "/reservations",
      }
    case "CANCELLED":
      return {
        type: "reservation_cancelled",
        title: "Reservation cancelled",
        message: `${ctx.customer.name} cancelled their booking for ${when}.`,
        href: "/reservations",
      }
    case "CONFIRMED":
      return {
        type: "reservation_confirmed",
        title: "Reservation confirmed",
        message: `${ctx.customer.name} confirmed their booking for ${when}${tableName ? ` (${tableName})` : ""}.`,
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

  async getById(id: string, restaurantId?: string) {
    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        ...(restaurantId ? { restaurantId } : {}),
      },
    })
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

    try {
      const targetTable = await prisma.table.findUnique({
        where: { id: data.tableId },
        select: { groupId: true },
      })

      const tableIdsToCheck = targetTable?.groupId
        ? (
            await prisma.table.findMany({
              where: { restaurantId: data.restaurantId, groupId: targetTable.groupId },
              select: { id: true },
            })
          ).map((t) => t.id)
        : [data.tableId]

      const conflict = await prisma.reservation.findFirst({
        where: {
          restaurantId: data.restaurantId,
          tableId: { in: tableIdsToCheck },
          status: { in: ACTIVE_STATUSES },
          reservedFor: { gte: windowStart, lte: windowEnd },
        },
        orderBy: { reservedFor: "asc" },
      })

      return {
        available: !conflict,
        conflictingReservation: conflict ? toApiShape(conflict) : null,
      }
    } catch (err) {
      console.warn("[checkAvailability] Error checking availability with groups, falling back:", err)
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
    }
  },

  async publicBook(data: {
    restaurantId: string
    customerName: string
    customerEmail: string
    customerPhone?: string
    tableId?: string
    partySize: number
    reservedFor: Date
    notes?: string
  }, locale?: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
      select: { id: true, name: true, isActive: true },
    })
    if (!restaurant || !restaurant.isActive) {
      throw new Error("Restaurant not found or not accepting bookings")
    }

    const email = data.customerEmail.toLowerCase().trim()
    const phone = data.customerPhone?.trim() || null

    let customer = await prisma.customer.findFirst({
      where: {
        restaurantId: data.restaurantId,
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: data.customerName.trim(),
          email,
          ...(phone ? { phone } : {}),
        },
      })
    } else {
      customer = await prisma.customer.create({
        data: {
          restaurantId: data.restaurantId,
          name: data.customerName.trim(),
          email,
          phone,
        },
      })
    }

    return this.create({
      restaurantId: data.restaurantId,
      customerId: customer.id,
      tableId: data.tableId,
      partySize: data.partySize,
      reservedFor: data.reservedFor,
      notes: data.notes,
      isPublicBooking: true,
      locale,
    })
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
    isPublicBooking?: boolean
    locale?: string
  }) {
    // Frontend sends "__customer_choice__" sentinel when guest picks their own table.
    // Treat it as undefined (no table assigned yet).
    const rawTableId = data.tableId === "__customer_choice__" ? undefined : data.tableId

    // Verify tableId actually exists in the database for this restaurant to avoid Foreign Key errors
    let assignedTableId: string | undefined = undefined
    if (rawTableId) {
      try {
        const tableRecord = await prisma.table.findFirst({
          where: {
            restaurantId: data.restaurantId,
            OR: [
              { id: rawTableId },
              { number: rawTableId },
            ],
          },
          select: { id: true },
        })
        if (tableRecord) {
          assignedTableId = tableRecord.id
        }
      } catch (err) {
        console.warn("[create] Table lookup warning:", err)
      }
    }

    if (data.status !== "CHECKED_IN") {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: data.restaurantId },
        select: { openingTime: true, closingTime: true },
      })
      if (restaurant && restaurant.openingTime !== null && restaurant.closingTime !== null) {
        const minutes = data.reservedFor.getHours() * 60 + data.reservedFor.getMinutes()
        if (minutes < restaurant.openingTime || minutes > restaurant.closingTime) {
          const formatMin = (m: number) =>
            `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
          throw new Error(
            `Reservation time must be within opening hours (${formatMin(restaurant.openingTime)} - ${formatMin(restaurant.closingTime)})`,
          )
        }
      }
    }

    if (assignedTableId) {
      const { available } = await this.checkAvailability({
        restaurantId: data.restaurantId,
        tableId: assignedTableId,
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
        tableId: assignedTableId ?? null,
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
        table: { select: { id: true, number: true, section: true, floor: true } },
      },
    })

    // The table is now booked, so the floor plan should show it as Reserved.
    if (assignedTableId) {
      await syncTableStatus(assignedTableId)
    }

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
            locale: data.locale,
          })
        } else {
          await sms.sendReservationConfirmationSms({
            to: reservation.customer.phone as string,
            customerName: reservation.customer.name,
            restaurantName: reservation.restaurant.name,
            reservedFor: reservation.reservedFor,
            partySize: reservation.partySize,
            confirmUrl,
            locale: data.locale,
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

    // Record in staff notification feed ONLY for bookings made by customers on
    // the public booking page. Manual reservations created by logged-in staff
    // do not generate redundant notifications for themselves.
    if (data.isPublicBooking || !data.createdById) {
      const when = formatReservationDateTime(reservation.reservedFor)
      const tableName = reservation.table ? `Table ${reservation.table.number}` : null
      await notify(reservation.restaurantId, {
        type: "reservation_new",
        title: "Online booking received",
        message: `${reservation.customer.name} booked online for ${reservation.partySize} guests on ${when}${tableName ? ` (${tableName})` : ""}.`,
        href: "/reservations",
      })
    }

    const { restaurant: _r, table, ...rest } = reservation
    const result = toApiShape({
      ...rest,
      // Match the list endpoint's shape so the frontend renders the customer
      // name and table correctly from the create response without a refetch.
      customer: reservation.customer
        ? { id: reservation.customer.id, name: reservation.customer.name, email: reservation.customer.email, phone: reservation.customer.phone }
        : null,
      table: table ? { id: table.id, name: table.number, number: table.number, floor: table.floor, location: table.section } : null,
    })
    realtimeService.broadcastToRestaurant(reservation.restaurantId, "RESERVATION_CREATED", result)
    return result
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
        groupId: true,
        groupName: true,
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
    const rawConflictIds = new Set(conflicts.map((c) => c.tableId).filter(Boolean) as string[])

    // Expand occupied tables to include all partner tables in any booked group
    const occupiedTableIds = new Set<string>()
    for (const t of tables) {
      if (rawConflictIds.has(t.id)) {
        occupiedTableIds.add(t.id)
        if (t.groupId) {
          for (const partner of tables) {
            if (partner.groupId === t.groupId) {
              occupiedTableIds.add(partner.id)
            }
          }
        }
      }
    }

    // Compute combined group capacities so groups can seat larger parties
    const groupCapacities = new Map<string, number>()
    for (const t of tables) {
      if (t.groupId) {
        groupCapacities.set(t.groupId, (groupCapacities.get(t.groupId) ?? 0) + t.capacity)
      }
    }

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
      tables: tables.map((t) => {
        const effectiveCapacity = t.groupId ? (groupCapacities.get(t.groupId) ?? t.capacity) : t.capacity
        return {
          ...t,
          name: t.number,
          groupId: t.groupId,
          groupName: t.groupName,
          available: !occupiedTableIds.has(t.id) && effectiveCapacity >= reservation.partySize,
        }
      }),
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

      let effectiveCapacity = table.capacity
      if (table.groupId) {
        const groupTables = await prisma.table.findMany({
          where: { restaurantId: reservation.restaurantId, groupId: table.groupId },
          select: { capacity: true },
        })
        effectiveCapacity = groupTables.reduce((sum, gt) => sum + gt.capacity, 0)
      }

      if (effectiveCapacity < reservation.partySize) {
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
    const result = toApiShape(updated)
    realtimeService.broadcastToRestaurant(updated.restaurantId, "RESERVATION_STATUS_CHANGED", result)
    return result
  },

  /**
   * Staff-facing: re-sends the confirmation email to any email address.
   * Useful when the customer's email on file is wrong or staff needs to send
   * the link to a different address.
   */
  async resendConfirmationEmail(reservationId: string, restaurantId: string, toEmail: string, locale?: string) {
    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, restaurantId },
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

    // Generate a fresh token
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
      locale,
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
    const result = toApiShape(updated)
    realtimeService.broadcastToRestaurant(updated.restaurantId, "RESERVATION_STATUS_CHANGED", result)
    return result
  },

  async update(
    id: string,
    restaurantId: string,
    data: Partial<{
      tableId: string | null
      partySize: number
      reservedFor: Date
      notes: string
    }>,
  ) {
    const existing = await prisma.reservation.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Reservation not found")
    }

    if (data.reservedFor) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { openingTime: true, closingTime: true },
      })
      if (restaurant && restaurant.openingTime !== null && restaurant.closingTime !== null) {
        const minutes = data.reservedFor.getHours() * 60 + data.reservedFor.getMinutes()
        if (minutes < restaurant.openingTime || minutes > restaurant.closingTime) {
          const formatMin = (m: number) =>
            `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
          throw new Error(
            `Reservation time must be within opening hours (${formatMin(restaurant.openingTime)} - ${formatMin(restaurant.closingTime)})`,
          )
        }
      }
    }

    // If changing table, check availability
    if (data.tableId && data.tableId !== existing.tableId) {
      const reservedFor = data.reservedFor ?? existing.reservedFor
      const { available } = await this.checkAvailability({
        restaurantId,
        tableId: data.tableId,
        reservedFor,
      })
      if (!available) {
        throw new Error("Table is not available at the requested time")
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: data as Prisma.ReservationUpdateInput,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        table: { select: { id: true, number: true, section: true, floor: true } },
      },
    })
    // Reassigning to another table releases the old one and books the new one.
    if (existing.tableId) await syncTableStatus(existing.tableId)
    if (reservation.tableId) await syncTableStatus(reservation.tableId)
    const ctx = await getNotificationContext(reservation.id)
    if (ctx) {
      const when = formatReservationDateTime(ctx.reservedFor)
      await notify(reservation.restaurantId, {
        type: "reservation_updated",
        title: "Reservation updated",
        message: `${ctx.customer.name}'s booking was updated to ${when}.`,
        href: "/reservations",
      })
    }
    const { table, ...rest } = reservation
    const result = toApiShape({
      ...rest,
      table: table ? { id: table.id, name: table.number, number: table.number, floor: table.floor, location: table.section } : null,
    })
    realtimeService.broadcastToRestaurant(restaurantId, "RESERVATION_UPDATED", result)
    return result
  },

  /**
   * Updates the reservation status. Staff can set any valid status
   * (PENDING, CONFIRMED, CHECKED_IN/SEATED, COMPLETED, CANCELLED, NO_SHOW)
   * and table occupancy is automatically synced.
   */
  async updateStatus(id: string, restaurantId: string, apiStatus: string) {
    const existing = await prisma.reservation.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Reservation not found")
    }

    const nextStatus = API_TO_DB_STATUS[apiStatus]
    if (!nextStatus) {
      throw new Error("Invalid status")
    }

    if (existing.status === nextStatus) {
      return toApiShape(existing)
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        table: { select: { id: true, number: true, section: true, floor: true } },
      },
    })
    // Seating occupies the table; cancelling/completing/no-showing frees it.
    await syncTableStatus(reservation.tableId)
    await notifyStatusChange(reservation.id, reservation.restaurantId, nextStatus)
    const result = toApiShape({
      ...reservation,
      table: reservation.table ? { id: reservation.table.id, name: reservation.table.number, number: reservation.table.number, floor: reservation.table.floor, location: reservation.table.section } : null,
    })
    realtimeService.broadcastToRestaurant(restaurantId, "RESERVATION_STATUS_CHANGED", result)
    return result
  },

  async cancel(id: string, restaurantId: string) {
    return this.updateStatus(id, restaurantId, "CANCELLED")
  },

  async remove(id: string, restaurantId: string) {
    const existing = await prisma.reservation.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Reservation not found")
    }
    // Grab the message context before the row is gone.
    const ctx = await getNotificationContext(id)
    const deleted = await prisma.reservation.delete({ where: { id } })
    await syncTableStatus(existing.tableId)
    if (ctx) {
      const when = formatReservationDateTime(ctx.reservedFor)
      await notify(existing.restaurantId, {
        type: "reservation_updated",
        title: "Reservation deleted",
        message: `${ctx.customer.name}'s booking for ${when} was deleted.`,
        href: "/reservations",
      })
    }
    realtimeService.broadcastToRestaurant(restaurantId, "RESERVATION_DELETED", { id })
    return deleted
  },
}
