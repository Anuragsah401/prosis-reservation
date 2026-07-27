import { prisma } from "@/db/client"

export const customerService = {
  async list(restaurantId: string) {
    return prisma.customer.findMany({ where: { restaurantId } })
  },

  async getById(id: string) {
    return prisma.customer.findUnique({ where: { id } })
  },

  async create(data: { restaurantId: string; name: string; email?: string; phone?: string }) {
    return prisma.customer.create({ data })
  },

  async update(id: string, data: Partial<{ name: string; email: string; phone: string; notes: string }>) {
    return prisma.customer.update({ where: { id }, data })
  },

  async remove(id: string) {
    return prisma.customer.delete({ where: { id } })
  },
}
