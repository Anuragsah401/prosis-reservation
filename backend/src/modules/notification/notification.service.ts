import { prisma } from "@/db/client"
import { realtimeService } from "@/modules/realtime/realtime.service"

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
    const notification = await prisma.notification.create({ data: { restaurantId, ...data } })
    realtimeService.broadcastToRestaurant(restaurantId, "NOTIFICATION_NEW", notification)
    return notification
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
    const res = await prisma.notification.updateMany({ where: { id, restaurantId }, data: { read: true } })
    realtimeService.broadcastToRestaurant(restaurantId, "NOTIFICATION_READ", { id, read: true })
    return res
  },

  async markAllRead(restaurantId: string) {
    const res = await prisma.notification.updateMany({ where: { restaurantId }, data: { read: true } })
    realtimeService.broadcastToRestaurant(restaurantId, "NOTIFICATION_READ", { all: true, read: true })
    return res
  },

  /** Deletes (dismisses) one notification, scoped to the restaurant. */
  async remove(id: string, restaurantId: string) {
    const res = await prisma.notification.deleteMany({ where: { id, restaurantId } })
    realtimeService.broadcastToRestaurant(restaurantId, "NOTIFICATION_READ", { id, dismissed: true })
    return res
  },
}
