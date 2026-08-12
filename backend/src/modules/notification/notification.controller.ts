import type { Response } from "express"
import { notificationService } from "@/modules/notification/notification.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"

/**
 * Staff-facing notification endpoints. All handlers are behind `requireAuth`
 * and read `restaurantId` from the signed-in user's JWT rather than a query
 * param — that way a tenant can only ever read or mutate their own feed.
 */
export const notificationController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant context for this user" })
    }
    res.status(200).json(await notificationService.list(restaurantId))
  },

  async markRead(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant context for this user" })
    }
    await notificationService.markRead(String(req.params.id), restaurantId)
    res.status(200).json({ read: true })
  },

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant context for this user" })
    }
    await notificationService.markAllRead(restaurantId)
    res.status(200).json({ read: true })
  },

  async remove(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant context for this user" })
    }
    await notificationService.remove(String(req.params.id), restaurantId)
    res.status(204).send()
  },
}
