import { Router } from "express"
import { authController } from "@/modules/auth/auth.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"

export const authRouter = Router()

authRouter.post("/register", authController.register)
authRouter.post("/login", authController.login)
authRouter.get("/me", requireAuth, authController.me)
