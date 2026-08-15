import { Router } from "express"
import { analyticsController } from "@/modules/analytics/analytics.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const analyticsRouter = Router()

// All analytics endpoints require a valid JWT (tenant-scoped by restaurantId).
analyticsRouter.use(requireAuth)
analyticsRouter.get("/summary", analyticsController.getSummary)
analyticsRouter.get("/daily-reservations", analyticsController.getDailyReservations)
analyticsRouter.get("/status-breakdown", analyticsController.getStatusBreakdown)
analyticsRouter.get("/hourly-demand", analyticsController.getHourlyDemand)
analyticsRouter.get("/table-utilization", analyticsController.getTableUtilization)
analyticsRouter.get("/weekday-traffic", analyticsController.getWeekdayTraffic)