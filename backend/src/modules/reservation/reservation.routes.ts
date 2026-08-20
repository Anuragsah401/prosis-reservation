import { Router } from "express"
import { reservationController } from "@/modules/reservation/reservation.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const reservationRouter = Router()

reservationRouter.get("/availability", reservationController.checkAvailability)
// Public guest-facing confirmation endpoints (token-authenticated, no JWT).
reservationRouter.get("/confirmation", reservationController.getConfirmationDetails)
reservationRouter.post("/confirm", reservationController.confirm)
reservationRouter.post("/cancel-by-token", reservationController.cancelByToken)
// Staff-facing: resend confirmation email to any address
reservationRouter.post("/:id/resend-confirmation", requireAuth, reservationController.resendConfirmationEmail)
reservationRouter.get("/", reservationController.list)
reservationRouter.get("/:id", reservationController.getById)
reservationRouter.post("/", requireAuth, reservationController.create)
reservationRouter.patch("/:id", requireAuth, reservationController.update)
reservationRouter.patch("/:id/status", requireAuth, reservationController.updateStatus)
reservationRouter.post("/:id/cancel", requireAuth, reservationController.cancel)
reservationRouter.delete("/:id", requireAuth, reservationController.remove)
