import rateLimit from "express-rate-limit"

/**
 * Throttles auth endpoints (register/login) to slow down brute-force and
 * credential-stuffing attempts. Keyed by IP by default. Tune via env vars
 * later if needed (e.g. a Redis store for multi-instance deployments).
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
})
