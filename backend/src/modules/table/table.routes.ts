import { Router } from "express"
import { tableController } from "@/modules/table/table.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const tableRouter = Router()

tableRouter.get("/", tableController.list)
tableRouter.get("/:id", tableController.getById)
tableRouter.post("/", requireAuth, tableController.create)
tableRouter.patch("/:id", requireAuth, tableController.update)
tableRouter.delete("/:id", requireAuth, tableController.remove)
