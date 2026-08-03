import { Router } from "express"
import { authController } from "@/modules/auth/auth.controller"
import { requireAuth } from "@/modules/auth/auth.middleware"
import { validateBody } from "@/middlewares/validate"
import { authRateLimiter } from "@/middlewares/rate-limit"
import { registerSchema, loginSchema } from "@/modules/auth/auth.validation"

export const authRouter = Router()

authRouter.post("/register", authRateLimiter, validateBody(registerSchema), authController.register)
authRouter.post("/login", authRateLimiter, validateBody(loginSchema), authController.login)
authRouter.get("/me", requireAuth, authController.me)
