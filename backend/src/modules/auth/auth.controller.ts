import type { Request, Response, NextFunction } from "express"
import { authService } from "@/modules/auth/auth.service"
import type { AuthenticatedRequest } from "@/modules/auth/auth.middleware"

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body)
      res.status(201).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Email already in use") {
        return res.status(409).json({ error: err.message })
      }
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body)
      res.status(200).json(result)
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid credentials") {
        return res.status(401).json({ error: err.message })
      }
      next(err)
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" })
      }
      const result = await authService.me(userId)
      if (!result) {
        return res.status(404).json({ error: "User not found" })
      }
      res.status(200).json(result)
    } catch (err) {
      next(err)
    }
  },
}
