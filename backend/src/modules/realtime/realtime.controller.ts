import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "@/config/env"
import type { JwtPayload } from "@/modules/auth/auth.service"
import { realtimeService } from "@/modules/realtime/realtime.service"

export const realtimeController = {
  /**
   * SSE Stream endpoint: GET /api/realtime/stream?restaurantId=...&token=...
   */
  async stream(req: Request, res: Response) {
    let token: string | undefined

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length)
    } else if (typeof req.query.token === "string" && req.query.token) {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication token required" })
    }

    let user: JwtPayload
    try {
      user = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" })
    }

    const requestedRestaurantId =
      typeof req.query.restaurantId === "string" && req.query.restaurantId
        ? req.query.restaurantId
        : user.restaurantId

    if (!requestedRestaurantId) {
      return res.status(400).json({ error: "restaurantId is required" })
    }

    // Set Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders?.()

    // Send initial connection event
    res.write(
      `data: ${JSON.stringify({
        type: "CONNECTED",
        payload: { restaurantId: requestedRestaurantId },
        timestamp: new Date().toISOString(),
      })}\n\n`,
    )

    // Register client in the realtime pool
    const removeClient = realtimeService.addClient(requestedRestaurantId, res, user.sub)

    // Clean up when client disconnects
    req.on("close", () => {
      removeClient()
    })
  },
}
