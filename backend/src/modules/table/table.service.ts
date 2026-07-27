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
      },
    })
    return toApiShape(table)
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      capacity: number
      location: string
      status: Prisma.TableUpdateInput["status"]
    }>,
  ) {
    const existing = await prisma.table.findUnique({ where: { id } })
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
      },
    })
    return toApiShape(table)
  },

  async remove(id: string) {
    const existing = await prisma.table.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Table not found")
    }
    return prisma.table.delete({ where: { id } })
  },
}
