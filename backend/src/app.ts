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

const configuredOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean)

function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true // Allow curl, server-to-server, and mobile apps

  const normalized = origin.trim().replace(/\/+$/, "")
  if (configuredOrigins.includes(normalized) || configuredOrigins.includes("*")) {
    return true
  }

  try {
    const url = new URL(normalized)
    const hostname = url.hostname

    // Allow seatbooking domains (.dk, .com, etc.)
    if (
      hostname === "seatbooking.dk" ||
      hostname.endsWith(".seatbooking.dk") ||
      hostname === "seatbooking.com" ||
      hostname.endsWith(".seatbooking.com") ||
      hostname.endsWith(".netlify.app") ||
      hostname.endsWith(".vercel.app") ||
      hostname.endsWith(".onrender.com")
    ) {
      return true
    }

    // Allow local development origins
    if (env.NODE_ENV !== "production" && (hostname === "localhost" || hostname === "127.0.0.1")) {
      return true
    }
  } catch {
    return false
  }

  return false
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        return callback(null, true)
      }
      callback(null, false)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Cache-Control",
      "Pragma",
      "Last-Event-ID",
      "X-Restaurant-Id",
      "Origin",
      "Keep-Alive",
      "User-Agent",
      "If-Modified-Since",
    ],
    exposedHeaders: ["Content-Type", "Cache-Control", "Connection"],
    optionsSuccessStatus: 200,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
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
