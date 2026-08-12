import { Router } from "express"
import { notificationController } from "@/modules/notification/notification.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const notificationRouter = Router()

notificationRouter.get("/", requireAuth, notificationController.list)
notificationRouter.patch("/read-all", requireAuth, notificationController.markAllRead)
notificationRouter.patch("/:id/read", requireAuth, notificationController.markRead)
notificationRouter.delete("/:id", requireAuth, notificationController.remove)
