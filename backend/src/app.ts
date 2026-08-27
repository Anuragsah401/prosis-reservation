import cors from "cors"
import express from "express"
import helmet from "helmet"
import morgan from "morgan"
import { env } from "@/config/env"
import { healthRouter } from "@/routes/health.routes"
import { authRouter } from "@/modules/auth/auth.routes"
import { restaurantRouter } from "@/modules/restaurant/restaurant.routes"
import { tableRouter } from "@/modules/table/table.routes"
import { reservationRouter } from "@/modules/reservation/reservation.routes"
import { customerRouter } from "@/modules/customer/customer.routes"
import { notificationRouter } from "@/modules/notification/notification.routes"
import { analyticsRouter } from "@/modules/analytics/analytics.routes"
import { realtimeRouter } from "@/modules/realtime/realtime.routes"
import { chatRouter } from "@/modules/chat/chat.routes"

export const app = express()

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim())

app.use(helmet())
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, server-to-server, no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"))

app.use("/api/health", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/restaurants", restaurantRouter)
app.use("/api/tables", tableRouter)
app.use("/api/reservations", reservationRouter)
app.use("/api/customers", customerRouter)
app.use("/api/notifications", notificationRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/realtime", realtimeRouter)
app.use("/api/chat", chatRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" })
})

// Centralized error handler
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: "Internal Server Error" })
  },
)
