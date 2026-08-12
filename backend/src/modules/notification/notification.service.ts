import { prisma } from "@/db/client"

export interface CreateNotificationInput {
  type: string
  title: string
  message: string
  href?: string
}

export const notificationService = {
  /**
   * Records a staff-facing notification for a restaurant (e.g. a new
   * reservation, a walk-in seated, a cancellation). Best-effort by contract —
   * callers wrap this in try/catch so a notification failure can never roll
   * back the reservation operation it describes.
   */
  async create(restaurantId: string, data: CreateNotificationInput) {
    return prisma.notification.create({ data: { restaurantId, ...data } })
  },

  /** Newest-first feed for the bell / notifications page. */
  async list(restaurantId: string) {
    return prisma.notification.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "desc" },
      take: 200,
    })
  },

  /** Marks one notification read, scoped to the restaurant so a tenant can't
   * touch another's rows. */
  async markRead(id: string, restaurantId: string) {
    return prisma.notification.updateMany({ where: { id, restaurantId }, data: { read: true } })
  },

  async markAllRead(restaurantId: string) {
    return prisma.notification.updateMany({ where: { restaurantId }, data: { read: true } })
  },

  /** Deletes (dismisses) one notification, scoped to the restaurant. */
  async remove(id: string, restaurantId: string) {
    return prisma.notification.deleteMany({ where: { id, restaurantId } })
  },
}
