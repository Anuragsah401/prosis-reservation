import { Router } from "express"
import { reservationController } from "@/modules/reservation/reservation.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"
import { publicApiRateLimiter } from "@/middlewares/rate-limit"

export const reservationRouter = Router()

// Public guest-facing endpoints (protected by rate limiting)
reservationRouter.get("/availability", publicApiRateLimiter, reservationController.checkAvailability)
reservationRouter.get("/confirmation", publicApiRateLimiter, reservationController.getConfirmationDetails)
reservationRouter.post("/confirm", publicApiRateLimiter, reservationController.confirm)
reservationRouter.post("/cancel-by-token", publicApiRateLimiter, reservationController.cancelByToken)
reservationRouter.post("/public-book", publicApiRateLimiter, reservationController.publicBook)

// Staff-facing endpoints (protected by JWT authentication)
reservationRouter.get("/", requireAuth, reservationController.list)
reservationRouter.get("/:id", requireAuth, reservationController.getById)
reservationRouter.post("/", requireAuth, reservationController.create)
reservationRouter.patch("/:id", requireAuth, reservationController.update)
reservationRouter.patch("/:id/status", requireAuth, reservationController.updateStatus)
reservationRouter.post("/:id/cancel", requireAuth, reservationController.cancel)
reservationRouter.delete("/:id", requireAuth, reservationController.remove)
reservationRouter.post("/:id/resend-confirmation", requireAuth, reservationController.resendConfirmationEmail)

