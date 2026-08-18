import { Router } from "express"
import { customerController } from "@/modules/customer/customer.controller"

export const customerRouter = Router()

customerRouter.get("/", customerController.list)
customerRouter.get("/:id", customerController.getById)
customerRouter.get("/:id/reservations", customerController.getReservations)
customerRouter.post("/", customerController.create)
customerRouter.patch("/:id", customerController.update)
customerRouter.delete("/:id", customerController.remove)
