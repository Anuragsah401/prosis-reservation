import { prisma } from "@/db/client"
import type { Prisma } from "@prisma/client"

// Public API uses `name`/`location`; the underlying Prisma model stores these
// as `number`/`section` (see prisma/schema.prisma). Map between the two here
// so the rest of the module (controller, routes, consumers) only ever deals
// with the requested field names.
function toApiShape<T extends { number: string; section: string | null }>(table: T) {
  const { number, section, ...rest } = table
  return { ...rest, name: number, location: section }
}

const ACTIVE_STATUSES: Array<"PENDING" | "CONFIRMED" | "SEATED"> = ["PENDING", "CONFIRMED", "SEATED"]
const RESERVATION_HOLD_MINUTES = 90

export const tableService = {
  async list(restaurantId: string, options?: { date?: string; reservedFor?: string } | string | Date) {
    let windowStart: Date
    let windowEnd: Date

    if (typeof options === "object" && options !== null && !(options instanceof Date) && options.reservedFor) {
      const target = new Date(options.reservedFor)
      windowStart = new Date(target.getTime() - RESERVATION_HOLD_MINUTES * 60_000)
      windowEnd = new Date(target.getTime() + RESERVATION_HOLD_MINUTES * 60_000)
    } else {
      const rawDate = typeof options === "object" && options !== null && !(options instanceof Date) ? options.date : options
      const baseDate = rawDate ? new Date(rawDate) : new Date()
      windowStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0)
      windowEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999)
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId },
      include: {
        reservations: {
          where: {
            status: { in: ACTIVE_STATUSES },
            reservedFor: { gte: windowStart, lte: windowEnd },
          },
          select: { status: true },
        },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    })

    return tables.map((t) => {
      let status = t.status
      if (t.status !== "MAINTENANCE") {
        const activeInWindow = t.reservations ?? []
        status = activeInWindow.some((r) => r.status === "SEATED")
          ? "OCCUPIED"
          : activeInWindow.length > 0
            ? "RESERVED"
            : "AVAILABLE"
      }
      const { reservations: _res, ...rest } = t
      return toApiShape({ ...rest, status })
    })
  },

  async listFloors(restaurantId: string) {
    const rows = await prisma.table.findMany({
      where: { restaurantId },
      select: { floor: true },
      distinct: ["floor"],
      orderBy: { floor: "asc" },
    })
    return rows.map((r) => r.floor)
  },

  async getById(id: string, options?: { date?: string; reservedFor?: string } | string | Date) {
    let windowStart: Date
    let windowEnd: Date

    if (typeof options === "object" && options !== null && !(options instanceof Date) && options.reservedFor) {
      const target = new Date(options.reservedFor)
      windowStart = new Date(target.getTime() - RESERVATION_HOLD_MINUTES * 60_000)
      windowEnd = new Date(target.getTime() + RESERVATION_HOLD_MINUTES * 60_000)
    } else {
      const rawDate = typeof options === "object" && options !== null && !(options instanceof Date) ? options.date : options
      const baseDate = rawDate ? new Date(rawDate) : new Date()
      windowStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0)
      windowEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999)
    }

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: { in: ACTIVE_STATUSES },
            reservedFor: { gte: windowStart, lte: windowEnd },
          },
          select: { status: true },
        },
      },
    })
    if (!table) return null

    let status = table.status
    if (table.status !== "MAINTENANCE") {
      const activeInWindow = table.reservations ?? []
      status = activeInWindow.some((r) => r.status === "SEATED")
        ? "OCCUPIED"
        : activeInWindow.length > 0
          ? "RESERVED"
          : "AVAILABLE"
    }
    const { reservations: _res, ...rest } = table
    return toApiShape({ ...rest, status })
  },

  async create(data: {
    restaurantId: string
    name: string
    capacity: number
    location?: string
    status?: Prisma.TableCreateInput["status"]
    floor?: string
    shape?: Prisma.TableCreateInput["shape"]
    positionX?: number
    positionY?: number
    width?: number
    height?: number
    rotation?: number
  }) {
    const existing = await prisma.table.findUnique({
      where: { restaurantId_number: { restaurantId: data.restaurantId, number: data.name } },
    })
    if (existing) {
      throw new Error("Table name already in use for this restaurant")
    }

    const table = await prisma.table.create({
      data: {
        restaurantId: data.restaurantId,
        number: data.name,
        capacity: data.capacity,
        section: data.location,
        status: data.status,
        floor: data.floor,
        shape: data.shape,
        positionX: data.positionX,
        positionY: data.positionY,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
      },
    })
    return toApiShape(table)
  },

  async update(
    id: string,
    restaurantId: string,
    data: Partial<{
      name: string
      capacity: number
      location: string
      status: Prisma.TableUpdateInput["status"]
      floor: string
      shape: Prisma.TableUpdateInput["shape"]
      positionX: number
      positionY: number
      width: number
      height: number
      rotation: number
    }>,
  ) {
    const existing = await prisma.table.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Table not found")
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        number: data.name,
        capacity: data.capacity,
        section: data.location,
        status: data.status,
        floor: data.floor,
        shape: data.shape,
        positionX: data.positionX,
        positionY: data.positionY,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
      },
    })
    return toApiShape(table)
  },

  async remove(id: string, restaurantId: string) {
    const existing = await prisma.table.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Table not found")
    }
    return prisma.table.delete({ where: { id } })
  },

  /**
   * Bulk-persist floor plan layout changes (position, size, shape, rotation,
   * floor assignment) for many tables in a single transaction. Used by the
   * floor plan designer's "Save layout" action.
   */
  async saveLayout(
    restaurantId: string,
    tables: Array<{
      id: string
      positionX: number
      positionY: number
      width?: number
      height?: number
      shape?: Prisma.TableUpdateInput["shape"]
      rotation?: number
      floor?: string
    }>,
  ) {
    const ids = tables.map((t) => t.id)
    const owned = await prisma.table.findMany({
      where: { id: { in: ids }, restaurantId },
      select: { id: true },
    })
    const ownedIds = new Set(owned.map((t) => t.id))
    const missing = ids.filter((id) => !ownedIds.has(id))
    if (missing.length > 0) {
      throw new Error(`Tables not found for this restaurant: ${missing.join(", ")}`)
    }

    const updated = await prisma.$transaction(
      tables.map((t) =>
        prisma.table.update({
          where: { id: t.id },
          data: {
            positionX: t.positionX,
            positionY: t.positionY,
            width: t.width,
            height: t.height,
            shape: t.shape,
            rotation: t.rotation,
            floor: t.floor,
          },
        }),
      ),
    )
    return updated.map(toApiShape)
  },

  /**
   * Full floor-plan sync from the designer: upserts every table by its name
   * (unique per restaurant) with layout + capacity, and removes tables that
   * no longer exist in the plan. This lets the frontend designer — whose
   * table ids are local-only — persist the complete plan so guest-facing
   * pages (e.g. reservation confirmation) can render the real layout.
   */
  async syncFloorPlan(
    restaurantId: string,
    tables: Array<{
      name: string
      capacity: number
      location?: string | null
      floor: string
      shape: Prisma.TableCreateInput["shape"]
      positionX: number
      positionY: number
      width: number
      height: number
      rotation: number
    }>,
  ) {
    const names = tables.map((t) => t.name)

    const synced = await prisma.$transaction(async (tx) => {
      // Remove tables deleted from the plan (skip any with reservations
      // attached to avoid orphaning bookings — they keep their table).
      const stale = await tx.table.findMany({
        where: { restaurantId, number: { notIn: names } },
        select: { id: true, _count: { select: { reservations: true } } },
      })
      const deletable = stale.filter((s) => s._count.reservations === 0).map((s) => s.id)
      if (deletable.length > 0) {
        await tx.table.deleteMany({ where: { id: { in: deletable } } })
      }

      const results = []
      for (const t of tables) {
        results.push(
          await tx.table.upsert({
            where: { restaurantId_number: { restaurantId, number: t.name } },
            create: {
              restaurantId,
              number: t.name,
              capacity: t.capacity,
              section: t.location,
              floor: t.floor,
              shape: t.shape,
              positionX: t.positionX,
              positionY: t.positionY,
              width: t.width,
              height: t.height,
              rotation: t.rotation,
            },
            update: {
              capacity: t.capacity,
              section: t.location,
              floor: t.floor,
              shape: t.shape,
              positionX: t.positionX,
              positionY: t.positionY,
              width: t.width,
              height: t.height,
              rotation: t.rotation,
            },
          }),
        )
      }
      return results
    })

    return synced.map(toApiShape)
  },
}

