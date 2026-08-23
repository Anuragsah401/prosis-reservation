import { prisma } from "@/db/client"

export const customerService = {
  async list(restaurantId: string) {
    return prisma.customer.findMany({ where: { restaurantId }, orderBy: { name: "asc" } })
  },

  async getById(id: string, restaurantId: string) {
    return prisma.customer.findFirst({ where: { id, restaurantId } })
  },

  async getReservations(customerId: string, restaurantId: string) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, restaurantId } })
    if (!customer) {
      throw new Error("Customer not found")
    }

    const reservations = await prisma.reservation.findMany({
      where: { customerId, restaurantId },
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
    restaurantId: string,
    data: Partial<{
      name: string
      email: string
      phone: string
      notes: string
      tags: string[]
    }>,
  ) {
    const existing = await prisma.customer.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Customer not found")
    }
    return prisma.customer.update({ where: { id }, data })
  },

  async remove(id: string, restaurantId: string) {
    const existing = await prisma.customer.findFirst({ where: { id, restaurantId } })
    if (!existing) {
      throw new Error("Customer not found")
    }
    return prisma.customer.delete({ where: { id } })
  },
}
