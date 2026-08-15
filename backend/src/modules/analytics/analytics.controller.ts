import { Request, Response } from "express"
import { analyticsService } from "@/modules/analytics/analytics.service"

export const analyticsController = {
  async getSummary(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getSummary(restaurantId, days)
    res.json(data)
  },

  async getDailyReservations(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 14, 1), 365)
    const data = await analyticsService.getDailyReservations(restaurantId, days)
    res.json(data)
  },

  async getStatusBreakdown(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const data = await analyticsService.getStatusBreakdown(restaurantId)
    res.json(data)
  },

  async getHourlyDemand(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getHourlyDemand(restaurantId, days)
    res.json(data)
  },

  async getTableUtilization(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getTableUtilization(restaurantId, days)
    res.json(data)
  },

  async getWeekdayTraffic(req: Request, res: Response) {
    const restaurantId = (req as any).user.restaurantId
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365)
    const data = await analyticsService.getWeekdayTraffic(restaurantId, days)
    res.json(data)
  },
}