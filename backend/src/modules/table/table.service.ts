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

export const tableService = {
  async list(restaurantId: string) {
    const tables = await prisma.table.findMany({ where: { restaurantId } })
    return tables.map(toApiShape)
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

  async getById(id: string) {
    const table = await prisma.table.findUnique({ where: { id } })
    return table ? toApiShape(table) : null
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

