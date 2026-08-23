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
      email: string | null
      phone: string | null
      address: string | null
      timezone: string
      openingTime: number
      closingTime: number
      isActive: boolean
    }>,
  ) {
    const existing = await prisma.restaurant.findUnique({ where: { id } })
    if (!existing) {
      throw new Error("Restaurant not found")
    }
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null
    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null
    if (data.address !== undefined) updateData.address = data.address ? data.address.trim() : null
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.openingTime !== undefined) updateData.openingTime = data.openingTime
    if (data.closingTime !== undefined) updateData.closingTime = data.closingTime
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    return prisma.restaurant.update({ where: { id }, data: updateData })
  },

  async remove(id: string) {
    return prisma.restaurant.delete({ where: { id } })
  },
}
