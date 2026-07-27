import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "@/config/env"
import type { JwtPayload } from "@/modules/auth/auth.service"

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" })
  }

  const token = header.slice("Bearer ".length)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}
