import { Router } from "express"
import { restaurantController } from "@/modules/restaurant/restaurant.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const restaurantRouter = Router()

restaurantRouter.get("/profile", requireAuth, restaurantController.getProfile)
restaurantRouter.get("/", restaurantController.list)
restaurantRouter.get("/:id", restaurantController.getById)
restaurantRouter.post("/", requireAuth, restaurantController.create)
restaurantRouter.patch("/:id", requireAuth, restaurantController.update)
restaurantRouter.delete("/:id", requireAuth, restaurantController.remove)
