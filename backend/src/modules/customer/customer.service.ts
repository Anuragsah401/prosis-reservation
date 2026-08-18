import { prisma } from "@/db/client"

export const customerService = {
  async list(restaurantId: string) {
    return prisma.customer.findMany({ where: { restaurantId } })
  },

  async getById(id: string) {
    return prisma.customer.findUnique({ where: { id } })
  },

  async getReservations(customerId: string) {
    const reservations = await prisma.reservation.findMany({
      where: { customerId },
      orderBy: { reservedFor: "desc" },
      take: 50,
      include: {
        table: { select: { id: true, number: true, section: true } },
      },
    })
    return reservations.map((r) => {
      const { table, ...rest } = r
      return {
        ...rest,
        // The reservations list renders `name`/`location`, so map the table
        // columns onto those before the API shape is applied.
        table: table ? { id: table.id, name: table.number, location: table.section } : null,
      }
    })
  },

  async create(data: {
    restaurantId: string
    name: string
    email?: string
    phone?: string
    notes?: string
    tags?: string[]
  }) {
    return prisma.customer.create({ data })
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      email: string
      phone: string
      notes: string
      tags: string[]
    }>,
  ) {
    return prisma.customer.update({ where: { id }, data })
  },

  async remove(id: string) {
    return prisma.customer.delete({ where: { id } })
  },
}
