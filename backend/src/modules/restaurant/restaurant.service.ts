import { prisma } from "@/db/client"

export const restaurantService = {
  async list() {
    return prisma.restaurant.findMany()
  },

  async getById(id: string) {
    return prisma.restaurant.findUnique({ where: { id } })
  },

  async getProfile(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant) {
      throw new Error("Restaurant not found")
    }
    return restaurant
  },

  async create(data: {
    name: string
    slug: string
    email?: string
    phone?: string
    address?: string
    timezone?: string
  }) {
    const existing = await prisma.restaurant.findUnique({ where: { slug: data.slug } })
    if (existing) {
      throw new Error("Slug already in use")
    }
    return prisma.restaurant.create({ data })
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      email: string
      phone: string
      address: string
      timezone: string
      isActive: boolean
    }>,
  ) {
    const existing = await prisma.restaurant.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Restaurant not found")
    }
    return prisma.restaurant.update({ where: { id }, data })
  },

  async remove(id: string) {
    return prisma.restaurant.delete({ where: { id } })
  },
}
