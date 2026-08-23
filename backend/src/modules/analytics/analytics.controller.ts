import type { Response } from "express"
import { analyticsService } from "@/modules/analytics/analytics.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"

export const analyticsController = {
  async getSummary(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getSummary(restaurantId, days)
    res.json(data)
  },

  async getDailyReservations(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 14, 1), 365)
    const data = await analyticsService.getDailyReservations(restaurantId, days)
    res.json(data)
  },

  async getStatusBreakdown(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const data = await analyticsService.getStatusBreakdown(restaurantId)
    res.json(data)
  },

  async getHourlyDemand(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getHourlyDemand(restaurantId, days)
    res.json(data)
  },

  async getTableUtilization(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getTableUtilization(restaurantId, days)
    res.json(data)
  },

  async getWeekdayTraffic(req: AuthenticatedRequest, res: Response) {
    const restaurantId = req.user?.restaurantId
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurant associated with this account" })
    }
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getWeekdayTraffic(restaurantId, days)
    res.json(data)
  },
}